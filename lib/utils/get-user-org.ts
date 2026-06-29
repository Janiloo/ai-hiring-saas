import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns the current user's organization_id, or null.
 * Used by server actions to stamp new records with the correct org scope.
 */
export async function getUserOrgId(
  supabase: SupabaseClient
): Promise<string | null> {
  const { data } = await supabase
    .from("organization_members")
    .select("organization_id")
    .limit(1)
    .maybeSingle();
  return data?.organization_id ?? null;
}

/**
 * Returns both organization_id and role for the current user.
 * Used by server actions for explicit role-based permission checks
 * (defense-in-depth on top of RLS).
 */
export async function getUserOrgMembership(
  supabase: SupabaseClient
): Promise<{ orgId: string; orgRole: string } | null> {
  const { data } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return { orgId: data.organization_id, orgRole: data.role as string };
}
