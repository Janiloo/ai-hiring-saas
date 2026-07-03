import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getUserOrgMembership } from "@/lib/utils/get-user-org";
import { exchangeCodeForTokens, getProfileEmail } from "@/lib/utils/gmail";

// Google OAuth callback — stores the org's Gmail refresh token. Admin-only.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const settingsUrl = (q: string) => new URL(`/dashboard/settings?gmail=${q}`, request.url);

  const code  = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code) return NextResponse.redirect(settingsUrl("denied"));

  const cookieStore = await cookies();
  const storedState = cookieStore.get("gmail_oauth_state")?.value;
  if (!state || state !== storedState) {
    return NextResponse.redirect(settingsUrl("state_mismatch"));
  }

  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const membership = await getUserOrgMembership(supabase);
  if (!membership || membership.orgRole !== "admin") {
    return NextResponse.redirect(settingsUrl("forbidden"));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      // Happens if consent was previously granted without offline access
      return NextResponse.redirect(settingsUrl("no_refresh_token"));
    }

    const connectedEmail = await getProfileEmail(tokens.access_token);

    const { error } = await supabase
      .from("organizations")
      .update({
        gmail_refresh_token:   tokens.refresh_token,
        gmail_connected_email: connectedEmail,
      })
      .eq("id", membership.orgId);

    if (error) return NextResponse.redirect(settingsUrl("save_failed"));

    const response = NextResponse.redirect(settingsUrl("connected"));
    response.cookies.delete("gmail_oauth_state");
    return response;
  } catch (err) {
    console.error("[gmail-callback] OAuth failed:", err);
    return NextResponse.redirect(settingsUrl("error"));
  }
}
