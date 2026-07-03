import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ingestRecruitmentInbox } from "@/lib/utils/email-ingestion";

export const maxDuration = 300;

// Scheduled ingestion endpoint (e.g. Vercel Cron or n8n later).
// Auth: Authorization: Bearer <INGEST_CRON_SECRET>. Uses the service-role key
// because there is no user session — never expose this route without the secret.
export async function GET(request: Request) {
  const secret = process.env.INGEST_CRON_SECRET;
  const auth   = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url        = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    return NextResponse.json({ error: "Server not configured for cron ingestion." }, { status: 500 });
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Every org with a connected Gmail inbox
  const { data: orgs, error } = await supabase
    .from("organizations")
    .select("id, name, recruitment_email, gmail_refresh_token, created_by")
    .not("gmail_refresh_token", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: Record<string, unknown> = {};
  for (const org of orgs ?? []) {
    if (!org.created_by) continue; // need a user to attribute candidates to
    results[org.name] = await ingestRecruitmentInbox(supabase, org, org.created_by);
  }

  return NextResponse.json({ ok: true, results });
}
