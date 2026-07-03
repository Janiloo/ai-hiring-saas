import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { ensureOrganization } from "@/lib/actions/invitations";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code        = searchParams.get("code");
  const next        = searchParams.get("next");
  const companyName = searchParams.get("company_name"); // set by Create Workspace flow

  if (code) {
    const cookieStore = await cookies();
    const supabase    = createClient(cookieStore);
    const { error }   = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: membership } = await supabase
          .from("organization_members")
          .select("id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (!membership) {
          // ── Create Workspace flow ────────────────────────────────────────
          // company_name is set when the user confirmed from the register page.
          if (companyName) {
            await ensureOrganization(companyName);
            return NextResponse.redirect(`${origin}${next ?? "/dashboard"}`);
          }

          // ── Invitation safety net ────────────────────────────────────────
          // No org and no company_name — check for a pending invite to redirect to.
          if (user.email) {
            const { data: invitation } = await supabase
              .from("invitations")
              .select("token")
              .eq("email", user.email.toLowerCase())
              .eq("status", "pending")
              .gt("expires_at", new Date().toISOString())
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (invitation) {
              return NextResponse.redirect(
                `${origin}/accept-invite?token=${invitation.token}`
              );
            }
          }
        }
      }

      return NextResponse.redirect(`${origin}${next ?? "/dashboard"}`);
    }
  }

  return NextResponse.redirect(`${origin}/forgot-password?error=link_expired`);
}
