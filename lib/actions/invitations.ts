"use server";

import { randomBytes, randomUUID } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { sendInvitationEmail } from "@/lib/utils/send-invitation-email";
import type { OrgRole } from "@/types/organization";

export type ActionState = { error: string } | null;

// ─────────────────────────────────────────────────────────────────────────────
// ensureOrganization
// Creates an org + makes the current user its admin if they have no org yet.
// Returns the organization_id.
// ─────────────────────────────────────────────────────────────────────────────
export async function ensureOrganization(name: string): Promise<string | null> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Check if user already belongs to an org
  const { data: existing } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (existing) return existing.organization_id;

  // Generate the UUID here so we never need to SELECT the org back
  // (the organizations SELECT policy requires membership, which doesn't exist yet)
  const orgId = randomUUID();

  const { error: orgError } = await supabase
    .from("organizations")
    .insert({ id: orgId, name: name.trim(), created_by: user.id });

  if (orgError) return null;

  // Add creator as admin (RLS policy "Creator becomes first admin" enforces role=admin)
  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({ user_id: user.id, organization_id: orgId, role: "admin" });

  if (memberError) return null;

  return orgId;
}

// ─────────────────────────────────────────────────────────────────────────────
// createInvitation
// SECURITY: role is validated server-side. Token generated server-side.
// ─────────────────────────────────────────────────────────────────────────────
export async function createInvitation(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const role  = (formData.get("role") as string) as OrgRole;
  const orgId = (formData.get("organization_id") as string)?.trim();

  if (!email || !role || !orgId) return { error: "Missing required fields." };

  const validRoles: OrgRole[] = ["admin", "recruiter", "interviewer"];
  if (!validRoles.includes(role)) return { error: "Invalid role." };

  // Verify caller is admin of this org (NEVER trust frontend for this)
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", orgId)
    .single();

  if (!membership || membership.role !== "admin") {
    return { error: "Only admins can invite team members." };
  }

  // Prevent duplicate pending invitations for the same email + org
  const { data: existing } = await supabase
    .from("invitations")
    .select("id")
    .eq("email", email)
    .eq("organization_id", orgId)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return { error: "A pending invitation already exists for this email." };
  }

  // Generate a cryptographically secure token — NEVER expose via URL params
  const token     = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error: insertError } = await supabase.from("invitations").insert({
    email,
    role,
    organization_id: orgId,
    invited_by:      user.id,
    token,
    expires_at:      expiresAt,
  });

  if (insertError) return { error: insertError.message };

  // Fetch org name for the email
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .single();

  const baseUrl  = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${baseUrl}/accept-invite?token=${token}`;

  await sendInvitationEmail({
    to:       email,
    orgName:  org?.name ?? "Your Organization",
    role,
    inviteUrl,
  });

  revalidatePath("/dashboard/settings/team");
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// revokeInvitation
// Admin-only. Marks invitation as revoked.
// ─────────────────────────────────────────────────────────────────────────────
export async function revokeInvitation(
  invitationId: string
): Promise<ActionState> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  // Verify the invitation belongs to an org where the caller is admin
  const { data: inv } = await supabase
    .from("invitations")
    .select("organization_id")
    .eq("id", invitationId)
    .single();

  if (!inv) return { error: "Invitation not found." };

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", inv.organization_id)
    .single();

  if (!membership || membership.role !== "admin") {
    return { error: "Only admins can revoke invitations." };
  }

  const { error } = await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId)
    .eq("status", "pending");

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings/team");
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// acceptInvitation
// SECURITY RULES (NON-NEGOTIABLE):
//   - Role is ALWAYS read from the DB invitation record, never from the client.
//   - Token is validated server-side.
//   - User email must match invitation email.
//   - Invitation must be pending and not expired.
// ─────────────────────────────────────────────────────────────────────────────
export async function acceptInvitation(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to accept an invitation." };

  const token = (formData.get("token") as string)?.trim();
  if (!token) return { error: "Invalid invitation link." };

  // Fetch invitation — role comes ONLY from DB
  const { data: inv, error: invError } = await supabase
    .rpc("get_invitation_by_token", { p_token: token });

  if (invError || !inv || inv.length === 0) {
    return { error: "Invitation not found or invalid." };
  }

  const invitation = inv[0];

  // Validate status
  if (invitation.status !== "pending") {
    return { error: `This invitation has already been ${invitation.status}.` };
  }

  // Validate expiry
  if (new Date(invitation.expires_at) < new Date()) {
    return { error: "This invitation has expired. Please ask your admin to send a new one." };
  }

  // Validate email — NEVER trust frontend for this
  if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    return {
      error: `This invitation was sent to ${invitation.email}. Please sign in with that email address.`,
    };
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("organization_id", invitation.organization_id)
    .maybeSingle();

  if (existing) {
    redirect("/dashboard");
  }

  // Insert member — role comes from invitation.role (DB), not from any form field
  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({
      user_id:         user.id,
      organization_id: invitation.organization_id,
      role:            invitation.role, // DB-sourced — never from client
    });

  if (memberError) return { error: memberError.message };

  // Mark invitation accepted
  await supabase
    .from("invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  redirect("/dashboard");
}
