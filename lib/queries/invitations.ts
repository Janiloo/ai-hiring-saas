import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { Invitation, InvitationPublic } from "@/types/invitation";
import type { Organization, OrgMember } from "@/types/organization";

/**
 * Looks up an invitation by token using a SECURITY DEFINER function so it works
 * for unauthenticated users (the token is the secret — 256-bit entropy).
 */
export async function getInvitationByToken(
  token: string
): Promise<InvitationPublic | null> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase.rpc("get_invitation_by_token", {
    p_token: token,
  });

  if (error) {
    console.error("[getInvitationByToken] RPC error:", error.message, error.code);
    return null;
  }
  if (!data || data.length === 0) return null;
  return data[0] as InvitationPublic;
}

/** Returns all invitations for the given org (admin only — RLS enforces this). */
export async function getInvitationsByOrg(
  organizationId: string
): Promise<Invitation[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as Invitation[];
}

/**
 * Returns the organization and member record for the current user, or null.
 * Uses two separate queries instead of a PostgREST join to avoid dual-RLS
 * evaluation issues when the member row was just inserted.
 */
export async function getUserOrganization(): Promise<{
  org:    Organization;
  member: OrgMember;
} | null> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Step 1 — get the membership row
  const { data: membership } = await supabase
    .from("organization_members")
    .select("id, user_id, organization_id, role, created_at")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) return null;

  // Step 2 — get the org separately (avoids join+RLS interaction)
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, created_by, created_at")
    .eq("id", membership.organization_id)
    .maybeSingle();

  if (!org) return null;

  return {
    org:    org as Organization,
    member: membership as OrgMember,
  };
}

/** Returns all members of the given org (RLS: org members only). */
export async function getOrgMembers(organizationId: string): Promise<OrgMember[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("organization_members")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data as OrgMember[];
}
