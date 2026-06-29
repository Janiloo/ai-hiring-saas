"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type ActionState = { error: string } | null;

export async function deleteAccount(
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies();
  const supabase    = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  // Block deletion if this user is the only admin of their org.
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membership?.role === "admin") {
    const { count } = await supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", membership.organization_id)
      .eq("role", "admin");

    if ((count ?? 0) <= 1) {
      return {
        error:
          "You are the only admin of this organization. Please assign another admin before deleting your account.",
      };
    }
  }

  // Delete via SECURITY DEFINER function (migration 014) — runs as the DB
  // owner so it can access auth.users without a service-role key. Cascades
  // to organization_members, invitations, job_posts, candidates, etc.
  const { error: deleteError } = await supabase.rpc("delete_own_account");
  if (deleteError) return { error: deleteError.message };

  await supabase.auth.signOut();

  redirect("/login");
}
