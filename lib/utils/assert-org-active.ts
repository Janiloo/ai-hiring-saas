import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns true if the organization is active (not suspended).
 *
 * Suspension disables *write* operations (job posting, candidate management,
 * interviews, Gmail sync, AI evaluation) while leaving reads / login intact.
 * Every mutating tenant server action calls this before writing — server-side
 * enforcement that does not depend on the UI hiding buttons.
 *
 * Uses the `org_is_active` SECURITY DEFINER helper so it works regardless of the
 * caller's RLS visibility. Fails open only for unknown/legacy org ids.
 */
export async function isOrgActive(
  supabase: SupabaseClient,
  orgId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("org_is_active", { p_org_id: orgId });
  if (error) return true; // never block writes on an infra hiccup
  return data !== false;
}

export const ORG_SUSPENDED_MESSAGE =
  "This organization is suspended. Hiring operations are disabled. Contact your platform administrator.";
