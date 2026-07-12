"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/platform/auth";
import type { OrgStatus } from "@/types/platform";

export type PlatformActionState = { error: string } | { success: string } | null;

/**
 * Suspend or reactivate an organization. Delegates to the guarded, audited
 * `platform_set_org_status` RPC — the DB re-verifies platform-admin status and
 * writes the platform_audit_logs entry atomically.
 */
export async function setOrgStatus(
  orgId: string,
  status: OrgStatus
): Promise<PlatformActionState> {
  try {
    const { supabase } = await requirePlatformAdmin();

    const { error } = await supabase.rpc("platform_set_org_status", {
      p_org_id: orgId,
      p_status: status,
    });
    if (error) return { error: error.message };

    revalidatePath("/platform/organizations");
    revalidatePath(`/platform/organizations/${orgId}`);
    revalidatePath("/platform");
    revalidatePath("/platform/audit");

    return {
      success:
        status === "suspended"
          ? "Organization suspended."
          : "Organization reactivated.",
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Action failed." };
  }
}
