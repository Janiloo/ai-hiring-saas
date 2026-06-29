"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

type ActionState = { error: string } | null;

export async function approveDraft(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get("id") as string;
  if (!id) return { error: "Missing draft ID." };

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("email_drafts")
    .update({
      approval_status: "approved",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  const candidateId = formData.get("candidate_id") as string;
  if (candidateId) revalidatePath(`/dashboard/candidates/${candidateId}`);

  return null;
}

export async function rejectDraft(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get("id") as string;
  if (!id) return { error: "Missing draft ID." };

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("email_drafts")
    .update({ approval_status: "rejected" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  const candidateId = formData.get("candidate_id") as string;
  if (candidateId) revalidatePath(`/dashboard/candidates/${candidateId}`);

  return null;
}
