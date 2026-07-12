import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ingestRecruitmentInbox } from "@/lib/utils/email-ingestion";
import { processAiQueue } from "@/lib/utils/ai-queue";

export const maxDuration = 300;

// Scheduled ingestion endpoint (Vercel Cron / external scheduler / n8n).
// Auth: Authorization: Bearer <secret>. Accepts either INGEST_CRON_SECRET
// (manual/external schedulers) or CRON_SECRET (Vercel Cron sends this env var
// automatically as a Bearer token). Uses the service-role key because there is
// no user session — never expose this route without a secret configured.
export async function GET(request: Request) {
  const auth    = request.headers.get("authorization");
  const secrets = [process.env.INGEST_CRON_SECRET, process.env.CRON_SECRET].filter(Boolean);
  if (secrets.length === 0 || !secrets.some((s) => auth === `Bearer ${s}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url        = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    return NextResponse.json({ error: "Server not configured for cron ingestion." }, { status: 500 });
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Every ACTIVE org with a connected Gmail inbox — suspended orgs are skipped
  // so their Gmail synchronization is disabled while suspended.
  const { data: orgs, error } = await supabase
    .from("organizations")
    .select("id, name, recruitment_email, gmail_refresh_token, created_by")
    .eq("status", "active")
    .not("gmail_refresh_token", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: Record<string, unknown> = {};
  for (const org of orgs ?? []) {
    if (!org.created_by) continue; // need a user to attribute candidates to
    results[org.name] = await ingestRecruitmentInbox(supabase, org, org.created_by);
  }

  // Drain the AI evaluation queue (all orgs): processes candidates just
  // ingested above plus any pending/stuck retries from earlier runs.
  const aiQueue = await processAiQueue();

  return NextResponse.json({ ok: true, results, aiQueue });
}
