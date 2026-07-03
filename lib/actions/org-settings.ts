"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getUserOrgMembership } from "@/lib/utils/get-user-org";

export type ActionState = { error: string } | { success: string } | null;

/** Admin-only: set the organization's Recruitment Email (ingestion inbox). */
export async function updateRecruitmentEmail(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies();
  const supabase    = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const membership = await getUserOrgMembership(supabase);
  if (!membership) return { error: "You must belong to an organization." };
  if (membership.orgRole !== "admin") return { error: "Only admins can change recruitment settings." };

  const email = ((formData.get("recruitment_email") as string) ?? "").trim().toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  const { error } = await supabase
    .from("organizations")
    .update({ recruitment_email: email || null })
    .eq("id", membership.orgId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: "Recruitment email saved." };
}

/** Admin-only: disconnect the Gmail integration. */
export async function disconnectGmail(): Promise<ActionState> {
  const cookieStore = await cookies();
  const supabase    = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const membership = await getUserOrgMembership(supabase);
  if (!membership) return { error: "You must belong to an organization." };
  if (membership.orgRole !== "admin") return { error: "Only admins can change recruitment settings." };

  const { error } = await supabase
    .from("organizations")
    .update({ gmail_refresh_token: null, gmail_connected_email: null })
    .eq("id", membership.orgId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: "Gmail disconnected." };
}
