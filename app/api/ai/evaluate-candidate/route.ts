import { NextResponse } from "next/server";

/**
 * POST /api/ai/evaluate-candidate
 *
 * Receives a candidate_id, fetches candidate + job_post data from Supabase,
 * sends to Claude API, and writes back: ai_score, ai_recommendation, ai_reason.
 * Sets ai_status = 'completed' (or 'failed' on error).
 *
 * Expected payload (future):
 *   { candidate_id: string }
 *
 * AI only writes evaluation fields — it never changes stage or sends email.
 * All downstream actions require HR approval.
 */
export async function POST() {
  return NextResponse.json({ received: true }, { status: 200 });
}
