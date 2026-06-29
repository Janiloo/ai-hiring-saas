import { NextResponse } from "next/server";

/**
 * POST /api/webhooks/email-inbound
 *
 * Entry point for n8n Gmail trigger.
 * Expected payload (future):
 *   { from, subject, body, attachments[], job_post_id? }
 *
 * Will: parse email → create candidate → link to job_post_id → trigger AI evaluation.
 * Requires: service-role Supabase key (n8n sends server-to-server).
 */
export async function POST() {
  return NextResponse.json({ received: true }, { status: 200 });
}
