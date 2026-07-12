import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getUserOrgMembership } from "@/lib/utils/get-user-org";
import { isOrgActive } from "@/lib/utils/assert-org-active";
import { gmailConsentUrl } from "@/lib/utils/gmail";

// Starts the Gmail OAuth flow. Admin-only.
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const supabase    = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const membership = await getUserOrgMembership(supabase);
  if (!membership || membership.orgRole !== "admin") {
    return NextResponse.redirect(new URL("/dashboard/settings?gmail=forbidden", request.url));
  }

  // Suspended orgs cannot connect/sync Gmail.
  if (!(await isOrgActive(supabase, membership.orgId))) {
    return NextResponse.redirect(new URL("/dashboard/settings?gmail=suspended", request.url));
  }

  // CSRF: random state stored in an httpOnly cookie, verified in the callback
  const state = crypto.randomUUID();
  const response = NextResponse.redirect(gmailConsentUrl(state));
  response.cookies.set("gmail_oauth_state", state, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    maxAge:   600,
    path:     "/",
  });
  return response;
}
