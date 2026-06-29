import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next"); // explicit redirect target, if any

  if (code) {
    const cookieStore = await cookies();
    const supabase    = createClient(cookieStore);
    const { error }   = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // ── Safety net ────────────────────────────────────────────────────────
      // When the user arrives via a normal email confirmation (no explicit `next`),
      // check if they have a pending invitation. This handles the case where
      // someone registered, then confirmed their email, but never went back to
      // the invite link to complete the acceptance.
      if (!next) {
        const { data: { user } } = await supabase.auth.getUser();

        if (user?.email) {
          const { data: membership } = await supabase
            .from("organization_members")
            .select("id")
            .eq("user_id", user.id)
            .limit(1)
            .maybeSingle();

          if (!membership) {
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
