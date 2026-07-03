"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getUserOrgMembership } from "@/lib/utils/get-user-org";
import { processEmailEvents } from "@/lib/utils/email-events";
import type { ReportRecommendation } from "@/types/interview-report";

export type ActionState = { error: string } | { success: true } | null;

/**
 * Submit an interview report (evaluation data ONLY — never touches pipeline).
 * Allowed: the assigned interviewer of the interview. RLS enforces the same
 * rule at the database level. The DB trigger marks the interview completed
 * and enqueues the "feedback ready" notification for recruiters/admins.
 */
export async function submitInterviewReport(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies();
  const supabase    = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const membership = await getUserOrgMembership(supabase);
  if (!membership) return { error: "You must belong to an organization." };

  const interview_id   = formData.get("interview_id") as string;
  const rating         = Number(formData.get("rating"));
  const notes          = (formData.get("notes") as string)?.trim() || null;
  const recommendation = formData.get("recommendation") as ReportRecommendation;

  if (!interview_id || !recommendation) {
    return { error: "Rating and recommendation are required." };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Rating must be between 1 and 5." };
  }
  if (!["pass", "fail", "maybe"].includes(recommendation)) {
    return { error: "Invalid recommendation." };
  }

  // Verify this user is the assigned interviewer (defense-in-depth; RLS
  // insert policy enforces this too).
  const { data: interview } = await supabase
    .from("interviews")
    .select("id, candidate_id, organization_id, interviewer_id, status")
    .eq("id", interview_id)
    .maybeSingle();

  if (!interview) return { error: "Interview not found." };
  if (interview.interviewer_id !== user.id) {
    return { error: "Only the assigned interviewer can submit a report for this interview." };
  }

  const { error } = await supabase.from("interview_reports").insert({
    organization_id: interview.organization_id,
    interview_id,
    candidate_id:    interview.candidate_id,
    interviewer_id:  user.id,
    rating,
    notes,
    recommendation,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "You have already submitted a report for this interview." };
    }
    return { error: error.message };
  }

  // DB trigger has marked the interview completed and enqueued the
  // recruiter/admin notification — deliver it.
  await processEmailEvents(supabase);

  revalidatePath(`/dashboard/interviews/${interview_id}`);
  revalidatePath("/dashboard/interviews");
  return { success: true };
}
