"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getUserOrgMembership } from "@/lib/utils/get-user-org";
import { isOrgActive, ORG_SUSPENDED_MESSAGE } from "@/lib/utils/assert-org-active";
import {
  type CandidateInsert,
  type CandidateStage,
  STAGE_META,
  STAGE_TRANSITIONS,
  ADMIN_ONLY_TARGET_STAGES,
} from "@/types/candidate";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/utils/log-activity";
import { processEmailEvents } from "@/lib/utils/email-events";

export type ActionState = { error: string } | null;

function parseFormData(formData: FormData): CandidateInsert {
  const job_post_id = (formData.get("job_post_id") as string) || null;

  return {
    job_post_id: job_post_id || null,
    full_name:   (formData.get("full_name") as string).trim(),
    email:       (formData.get("email") as string).trim().toLowerCase(),
    phone:       (formData.get("phone") as string)?.trim() || null,
    resume_url:  null,
    stage:       (formData.get("stage") as CandidateStage) ?? "applied",
    notes:       (formData.get("notes") as string)?.trim() || null,
  };
}

async function uploadResume(
  file: File,
  organizationId: string
): Promise<{ url: string } | { error: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin       = createServiceClient(supabaseUrl, serviceKey);

  const ext  = "pdf";
  const path = `${organizationId}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage
    .from("resumes")
    .upload(path, buffer, { contentType: "application/pdf", upsert: false });

  if (error) return { error: error.message };

  const { data: { publicUrl } } = admin.storage
    .from("resumes")
    .getPublicUrl(path);

  return { url: publicUrl };
}

export async function createCandidate(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies();
  const supabase    = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const membership = await getUserOrgMembership(supabase);
  if (!membership) return { error: "You must belong to an organization to add candidates." };
  if (membership.orgRole === "interviewer") return { error: "Interviewers cannot add candidates." };
  if (!(await isOrgActive(supabase, membership.orgId))) return { error: ORG_SUSPENDED_MESSAGE };

  const { orgId: organization_id } = membership;
  const payload = parseFormData(formData);

  const file = formData.get("resume_file") as File | null;
  if (file && file.size > 0) {
    if (file.type !== "application/pdf") return { error: "Only PDF files are allowed." };
    if (file.size > 10 * 1024 * 1024) return { error: "Resume must be under 10 MB." };
    const result = await uploadResume(file, organization_id);
    if ("error" in result) return { error: result.error };
    payload.resume_url = result.url;
  }

  const { data: created, error } = await supabase
    .from("candidates")
    .insert({ ...payload, user_id: user.id, organization_id })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logActivity({
    supabase,
    candidate_id: created.id,
    user_id:      user.id,
    type:         "APPLIED",
    title:        "Candidate added",
    description:  payload.job_post_id ? `Applied via ${payload.applied_via ?? "manual"}` : null,
    metadata:     { stage: payload.stage ?? "applied" },
  });

  // Deliver "application received" / "new candidate" emails (DB trigger enqueued them)
  await processEmailEvents(supabase);

  redirect("/dashboard/candidates");
}

export async function updateCandidate(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies();
  const supabase    = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const membership = await getUserOrgMembership(supabase);
  if (!membership) return { error: "You must belong to an organization." };
  if (membership.orgRole === "interviewer") return { error: "Interviewers cannot edit candidates." };
  if (!(await isOrgActive(supabase, membership.orgId))) return { error: ORG_SUSPENDED_MESSAGE };

  // Pipeline stage changes go ONLY through updateCandidateStage (state
  // machine + role enforcement) — strip stage from general edits.
  const { stage: _ignored, ...payload } = parseFormData(formData);

  const file = formData.get("resume_file") as File | null;
  if (file && file.size > 0) {
    if (file.type !== "application/pdf") return { error: "Only PDF files are allowed." };
    if (file.size > 10 * 1024 * 1024) return { error: "Resume must be under 10 MB." };
    const result = await uploadResume(file, membership.orgId);
    if ("error" in result) return { error: result.error };
    payload.resume_url = result.url;
  }

  // RLS enforces: admin or recruiter in same org can update
  const { error } = await supabase
    .from("candidates")
    .update(payload)
    .eq("id", id);

  if (error) return { error: error.message };

  redirect(`/dashboard/candidates/${id}`);
}

export async function deleteCandidate(id: string): Promise<ActionState> {
  const cookieStore = await cookies();
  const supabase    = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const membership = await getUserOrgMembership(supabase);
  if (!membership) return { error: "You must belong to an organization." };
  if (membership.orgRole === "interviewer") return { error: "Interviewers cannot delete candidates." };
  if (!(await isOrgActive(supabase, membership.orgId))) return { error: ORG_SUSPENDED_MESSAGE };

  // RLS enforces: creator or admin can delete
  const { error } = await supabase
    .from("candidates")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  redirect("/dashboard/candidates");
}

export async function updateCandidateStage(
  id: string,
  stage: CandidateStage
): Promise<ActionState> {
  const cookieStore = await cookies();
  const supabase    = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const membership = await getUserOrgMembership(supabase);
  if (!membership) return { error: "You must belong to an organization." };
  // Interviewers NEVER modify pipeline — evaluation only.
  if (membership.orgRole === "interviewer") return { error: "Interviewers cannot change candidate stages." };
  if (!(await isOrgActive(supabase, membership.orgId))) return { error: ORG_SUSPENDED_MESSAGE };

  const { data: current } = await supabase
    .from("candidates")
    .select("stage")
    .eq("id", id)
    .single();

  if (!current) return { error: "Candidate not found." };

  const fromStage = current.stage as CandidateStage;

  // ── State machine enforcement ─────────────────────────────────────────────
  if (!STAGE_TRANSITIONS[fromStage]?.includes(stage)) {
    return {
      error: `Invalid transition: ${STAGE_META[fromStage]?.label ?? fromStage} → ${STAGE_META[stage]?.label ?? stage}.`,
    };
  }

  // Final authority: only admins can move candidates to Hired or Rejected.
  if (ADMIN_ONLY_TARGET_STAGES.includes(stage) && membership.orgRole !== "admin") {
    return { error: `Only admins can move candidates to ${STAGE_META[stage].label}.` };
  }

  const { error } = await supabase
    .from("candidates")
    .update({ stage })
    .eq("id", id);

  if (error) return { error: error.message };

  // Audit logging is enforced by the DB trigger (trg_audit_candidate_stage).
  // Deliver any email events the trigger enqueued.
  await processEmailEvents(supabase);

  await logActivity({
    supabase,
    candidate_id: id,
    user_id:      user.id,
    type:         "STATUS_CHANGED",
    title:        `Stage updated to ${STAGE_META[stage].label}`,
    description:  current?.stage
      ? `Changed from ${STAGE_META[current.stage as CandidateStage]?.label ?? current.stage}`
      : null,
    metadata:     { from_stage: current?.stage ?? null, to_stage: stage },
  });

  revalidatePath("/dashboard/candidates");
  revalidatePath(`/dashboard/candidates/${id}`);
  return null;
}
