import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────────────────
// Platform-admin (SUPER_ADMIN) authorization.
//
// The authoritative check is the `am_i_platform_admin()` RPC, which reads the
// `platform_admins` table via SECURITY DEFINER — it cannot be spoofed from the
// client. `proxy.ts` performs a cheap coarse gate on the app_metadata claim;
// this is the real, DB-backed verification that every /platform page and action
// runs before touching any data.
// ─────────────────────────────────────────────────────────────────────────────

/** Returns true if the current session belongs to a platform admin. */
export async function isPlatformAdmin(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.rpc("am_i_platform_admin");
  if (error) return false;
  return data === true;
}

/**
 * Guard for platform server actions/queries. Returns the authenticated client +
 * user when the caller is a platform admin; throws otherwise. Every cross-org
 * data access in lib/platform must call this first.
 */
export async function requirePlatformAdmin(): Promise<{
  supabase: SupabaseClient;
  user: User;
}> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const ok = await isPlatformAdmin(supabase);
  if (!ok) throw new Error("Not authorized: platform administrators only.");

  return { supabase, user };
}

/**
 * Same guard, but for page-level use: redirects non-admins to /dashboard instead
 * of throwing, so a normal user who navigates to /platform is bounced cleanly.
 */
export async function requirePlatformAdminPage(): Promise<{
  supabase: SupabaseClient;
  user: User;
}> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ok = await isPlatformAdmin(supabase);
  if (!ok) redirect("/dashboard");

  return { supabase, user };
}
