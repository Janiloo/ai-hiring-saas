"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getUserOrgMembership } from "@/lib/utils/get-user-org";
import { type InterviewType, type InterviewStatus, INTERVIEW_TYPE_LABELS } from "@/types/interview";
import { logActivity } from "@/lib/utils/log-activity";

type ActionState = { error: string } | null;

function parseFormData(formData: FormData) {
  return {
    candidate_id:   formData.get("candidate_id") as string,
    job_post_id:    (formData.get("job_post_id") as string) || null,
    interviewer:    formData.get("interviewer") as string,
    interview_type: formData.get("interview_type") as InterviewType,
    scheduled_at:   formData.get("scheduled_at") as string,
    meeting_link:   (formData.get("meeting_link") as string) || null,
    notes:          (formData.get("notes") as string) || null,
    status:         (formData.get("status") as InterviewStatus) ?? "scheduled",
  };
}

export async function createInterview(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies();
  const supabase    = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const fields = parseFormData(formData);
  if (!fields.candidate_id || !fields.interviewer || !fields.interview_type || !fields.scheduled_at) {
    return { error: "Candidate, interviewer, type, and scheduled time are required." };
  }

  const membership = await getUserOrgMembership(supabase);
  if (!membership) return { error: "You must belong to an organization to schedule interviews." };
  if (membership.orgRole === "interviewer") return { error: "Interviewers cannot schedule interviews." };

  const { orgId: organization_id } = membership;

  const { error } = await supabase
    .from("interviews")
    .insert({ ...fields, user_id: user.id, organization_id });

  if (error) return { error: error.message };

  await logActivity({
    supabase,
    candidate_id: fields.candidate_id,
    user_id:      user.id,
    type:         "INTERVIEW_CREATED",
    title:        `${INTERVIEW_TYPE_LABELS[fields.interview_type]} interview scheduled`,
    description:  `Scheduled for ${new Date(fields.scheduled_at).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    })}`,
    metadata: {
      interview_type: fields.interview_type,
      scheduled_at:   fields.scheduled_at,
      interviewer:    fields.interviewer,
    },
  });

  redirect("/dashboard/interviews");
}

export async function updateInterview(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies();
  const supabase    = createClient(cookieStore);

  const fields = parseFormData(formData);
  if (!fields.candidate_id || !fields.interviewer || !fields.interview_type || !fields.scheduled_at) {
    return { error: "Candidate, interviewer, type, and scheduled time are required." };
  }

  const membership = await getUserOrgMembership(supabase);
  if (!membership) return { error: "You must belong to an organization." };
  if (membership.orgRole === "interviewer") return { error: "Interviewers cannot edit interviews." };

  // RLS enforces: admin or recruiter in the same org can update
  const { error } = await supabase
    .from("interviews")
    .update(fields)
    .eq("id", id);

  if (error) return { error: error.message };

  redirect(`/dashboard/interviews/${id}`);
}

export async function deleteInterview(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies();
  const supabase    = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const membership = await getUserOrgMembership(supabase);
  if (!membership) return { error: "You must belong to an organization." };
  if (membership.orgRole === "interviewer") return { error: "Interviewers cannot delete interviews." };

  const id = formData.get("id") as string;

  // RLS enforces: creator or admin can delete
  const { error } = await supabase.from("interviews").delete().eq("id", id);
  if (error) return { error: error.message };

  redirect("/dashboard/interviews");
}

export async function updateInterviewStatus(
  id: string,
  status: InterviewStatus
): Promise<void> {
  const cookieStore = await cookies();
  const supabase    = createClient(cookieStore);

  await supabase.from("interviews").update({ status }).eq("id", id);
  revalidatePath("/dashboard/interviews");
  revalidatePath(`/dashboard/interviews/${id}`);
}
