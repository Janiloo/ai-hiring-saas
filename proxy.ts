import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_CONFIGURED =
  SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("placeholder");

export async function proxy(request: NextRequest) {
  if (!SUPABASE_CONFIGURED) {
    return NextResponse.next({ request });
  }

  const { supabase, supabaseResponse } = createClient(request);

  // Must not run any logic between createClient and getUser
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Auth routes: unauthenticated-only pages — redirect logged-in users to dashboard
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/auth/callback");

  // Public routes: accessible to BOTH authenticated and unauthenticated users.
  // - /accept-invite: authenticated users must reach it to complete the join flow.
  // - /reset-password: exchanging a recovery link logs the user in (a recovery
  //   session is a real Supabase session), so this page MUST stay reachable while
  //   authenticated — otherwise the user is bounced to /dashboard and never sees
  //   the "set new password" form. The page redirects to /dashboard itself only
  //   after the password is successfully updated.
  const isPublicRoute =
    pathname.startsWith("/accept-invite") ||
    pathname.startsWith("/reset-password") ||
    // Machine-to-machine endpoints authenticate with their own bearer secrets
    // (INGEST_CRON_SECRET / CRON_SECRET / webhook signatures) — no user session
    // exists, so they must never be redirected to /login.
    pathname.startsWith("/api/ingest") ||
    pathname.startsWith("/api/webhooks");

  if (!user && !isAuthRoute && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Platform Administration: coarse gate on the spoof-proof app_metadata claim
  // (only the service role can write app_metadata). This is a cheap first line
  // of defense; app/platform/layout.tsx re-verifies against the platform_admins
  // table via the am_i_platform_admin() RPC (authoritative).
  if (pathname.startsWith("/platform")) {
    const isPlatformAdmin = user?.app_metadata?.platform_admin === true;
    if (!isPlatformAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
