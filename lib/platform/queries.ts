import { requirePlatformAdmin } from "@/lib/platform/auth";
import type {
  PlatformStats,
  PlatformAiUsage,
  PlatformOrganization,
  PlatformOrganizationDetail,
  PlatformUser,
  PlatformAuditLog,
} from "@/types/platform";

// ─────────────────────────────────────────────────────────────────────────────
// Read layer for the Platform Administration area.
//
// Every function calls requirePlatformAdmin() first (code-level guard), then
// invokes a SECURITY DEFINER RPC that ALSO re-checks is_platform_admin at the DB
// level (defense in depth). Existing tenant RLS is never bypassed by the normal
// app — only these guarded RPCs read across organizations.
// ─────────────────────────────────────────────────────────────────────────────

export async function getPlatformStats(): Promise<PlatformStats> {
  const { supabase } = await requirePlatformAdmin();
  const { data, error } = await supabase.rpc("get_platform_stats");
  if (error) throw new Error(error.message);
  return data as PlatformStats;
}

export async function getPlatformAiUsage(): Promise<PlatformAiUsage> {
  const { supabase } = await requirePlatformAdmin();
  const { data, error } = await supabase.rpc("get_platform_ai_usage");
  if (error) throw new Error(error.message);
  return data as PlatformAiUsage;
}

export async function getPlatformOrganizations(
  search?: string,
  status?: string
): Promise<PlatformOrganization[]> {
  const { supabase } = await requirePlatformAdmin();
  const { data, error } = await supabase.rpc("get_platform_organizations", {
    p_search: search?.trim() || null,
    p_status: status || null,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as PlatformOrganization[];
}

export async function getPlatformOrganization(
  id: string
): Promise<PlatformOrganizationDetail | null> {
  const { supabase } = await requirePlatformAdmin();
  const { data, error } = await supabase.rpc("get_platform_organization", {
    p_org_id: id,
  });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as PlatformOrganizationDetail[];
  return rows[0] ?? null;
}

export async function getPlatformUsers(
  search?: string,
  role?: string
): Promise<PlatformUser[]> {
  const { supabase } = await requirePlatformAdmin();
  const { data, error } = await supabase.rpc("get_platform_users", {
    p_search: search?.trim() || null,
    p_role: role || null,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as PlatformUser[];
}

export async function getPlatformAuditLogs(
  limit = 200
): Promise<PlatformAuditLog[]> {
  const { supabase } = await requirePlatformAdmin();
  const { data, error } = await supabase.rpc("get_platform_audit_logs", {
    p_limit: limit,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as PlatformAuditLog[];
}
