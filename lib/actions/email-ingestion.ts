"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getUserOrgMembership } from "@/lib/utils/get-user-org";
import { ingestRecruitmentInbox, type IngestionSummary } from "@/lib/utils/email-ingestion";

/** Manually sync the recruitment inbox. Admins and recruiters only. */
export async function syncRecruitmentInbox(): Promise<IngestionSummary> {
  const empty: IngestionSummary = { checked: 0, created: 0, noMatch: 0, skipped: 0, errors: 0 };

  const cookieStore = await cookies();
  const supabase    = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ...empty, error: "Not authenticated." };

  const membership = await getUserOrgMembership(supabase);
  if (!membership) return { ...empty, error: "You must belong to an organization." };
  if (membership.orgRole === "interviewer") {
    return { ...empty, error: "Interviewers cannot run inbox ingestion." };
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, recruitment_email, gmail_refresh_token, created_by")
    .eq("id", membership.orgId)
    .maybeSingle();

  if (!org) return { ...empty, error: "Organization not found." };

  const summary = await ingestRecruitmentInbox(supabase, org, user.id);

  if (summary.created > 0) {
    revalidatePath("/dashboard/candidates");
    revalidatePath("/dashboard/pipeline");
  }
  return summary;
}
