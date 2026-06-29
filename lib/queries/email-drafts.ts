import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { EmailDraft } from "@/types/email-draft";

export async function getEmailDraftsForCandidate(
  candidateId: string
): Promise<EmailDraft[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("email_drafts")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as EmailDraft[];
}
