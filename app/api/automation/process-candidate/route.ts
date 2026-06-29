import { NextResponse } from "next/server";

/**
 * POST /api/automation/process-candidate
 *
 * Called by n8n after HR approves an email draft.
 * Orchestrates the execution layer:
 *   1. Verify draft approval_status === 'approved'
 *   2. Send email to candidate (via Gmail API / SendGrid)
 *   3. Update candidate stage in Supabase
 *   4. Mark draft as sent
 *   5. Append entry to candidate_activity_log
 *
 * Expected payload (future):
 *   { draft_id: string }
 *
 * Never executes without an approved draft_id — enforced at DB level.
 */
export async function POST() {
  return NextResponse.json({ received: true }, { status: 200 });
}
