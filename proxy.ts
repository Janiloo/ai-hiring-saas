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
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/auth/callback");

  // Public routes: accessible to BOTH authenticated and unauthenticated users
  // /accept-invite must allow authenticated users so they can complete the join flow
  const isPublicRoute = pathname.startsWith("/accept-invite");

  if (!user && !isAuthRoute && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
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
