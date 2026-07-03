"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
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

/** Admin-only: update the organization name. */
export async function updateOrgName(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies();
  const supabase    = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const membership = await getUserOrgMembership(supabase);
  if (!membership) return { error: "You must belong to an organization." };
  if (membership.orgRole !== "admin") return { error: "Only admins can change the organization name." };

  const name = ((formData.get("org_name") as string) ?? "").trim();
  if (!name) return { error: "Organization name cannot be empty." };
  if (name.length > 100) return { error: "Organization name must be 100 characters or fewer." };

  const { error } = await supabase
    .from("organizations")
    .update({ name })
    .eq("id", membership.orgId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: "Organization name updated." };
}

/** Admin-only: upload or replace the organization logo. */
export async function uploadOrgLogo(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies();
  const supabase    = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const membership = await getUserOrgMembership(supabase);
  if (!membership) return { error: "You must belong to an organization." };
  if (membership.orgRole !== "admin") return { error: "Only admins can change the organization logo." };

  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) return { error: "No file selected." };

  const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Only PNG, JPEG, WebP, and SVG images are allowed." };
  }
  if (file.size > 2 * 1024 * 1024) return { error: "Logo must be under 2 MB." };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin       = createServiceClient(supabaseUrl, serviceKey);

  const ext  = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const path = `${membership.orgId}/logo.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from("org-logos")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = admin.storage
    .from("org-logos")
    .getPublicUrl(path);

  // Cache-bust: append timestamp so browsers pick up the new image
  const logoUrl = `${publicUrl}?t=${Date.now()}`;

  const { error: dbError } = await supabase
    .from("organizations")
    .update({ logo_url: logoUrl })
    .eq("id", membership.orgId);

  if (dbError) return { error: dbError.message };

  revalidatePath("/dashboard");
  return { success: "Logo updated." };
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
