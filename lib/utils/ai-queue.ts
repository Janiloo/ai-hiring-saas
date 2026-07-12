import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluateResume } from "@/lib/utils/ai-evaluation";
import type { JobPost } from "@/types/job-post";

// ─────────────────────────────────────────────────────────────────────────────
// Background AI evaluation queue.
//
// Candidate sync (Gmail ingestion) now only creates candidate records with
// ai_status='pending' and a stored resume PDF. This processor drains that
// queue OUTSIDE the request path:
//   - from the sync server action via Next's after() (post-response), and
//   - from the /api/ingest cron as a retry/fallback.
//
// States: pending → processing → completed | failed.
// 'processing' rows older than STUCK_MINUTES are reclaimed (crash recovery).
//
// RULES preserved: AI only parses/evaluates. It never picks the job post
// (email subject did that at sync time) and never moves pipeline stages.
// ─────────────────────────────────────────────────────────────────────────────

const STUCK_MINUTES = 10;
const BATCH_SIZE = 10;

export interface AiQueueSummary {
  processed: number;
  failed:    number;
  reclaimed: number;
}

function serviceClient(): SupabaseClient {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/** Downloads a stored resume (public bucket URL) and returns it as base64. */
async function fetchResumeBase64(resumeUrl: string): Promise<string> {
  const res = await fetch(resumeUrl);
  if (!res.ok) throw new Error(`Resume download failed (HTTP ${res.status}).`);
  return Buffer.from(await res.arrayBuffer()).toString("base64");
}

interface QueuedCandidate {
  id:              string;
  organization_id: string;
  job_post_id:     string | null;
  full_name:       string;
  resume_url:      string | null;
  notes:           string | null;
}

/**
 * Processes queued AI evaluations. Pass an orgId to restrict to one tenant
 * (used right after that org's sync); omit it to drain the whole queue (cron).
 * Never throws — sync/cron must not break because of AI failures.
 */
export async function processAiQueue(orgId?: string): Promise<AiQueueSummary> {
  const summary: AiQueueSummary = { processed: 0, failed: 0, reclaimed: 0 };

  try {
    const supabase = serviceClient();

    // Crash recovery: anything stuck in 'processing' too long goes back to pending.
    {
      const cutoff = new Date(Date.now() - STUCK_MINUTES * 60_000).toISOString();
      let q = supabase
        .from("candidates")
        .update({ ai_status: "pending" })
        .eq("ai_status", "processing")
        .lt("updated_at", cutoff);
      if (orgId) q = q.eq("organization_id", orgId);
      const { data: reclaimed } = await q.select("id");
      summary.reclaimed = reclaimed?.length ?? 0;
    }

    // Suspended orgs get no AI processing (platform suspension disables AI).
    let pendingQuery = supabase
      .from("candidates")
      .select("id, organization_id, job_post_id, full_name, resume_url, notes, organizations!inner(status)")
      .eq("ai_status", "pending")
      .eq("organizations.status", "active")
      .not("resume_url", "is", null)
      .not("job_post_id", "is", null)
      .limit(BATCH_SIZE);
    if (orgId) pendingQuery = pendingQuery.eq("organization_id", orgId);

    const { data: queue, error: queueError } = await pendingQuery;
    if (queueError) {
      console.error("[ai-queue] Queue read failed:", queueError.message);
      return summary;
    }
    if (!queue || queue.length === 0) return summary;

    for (const row of queue as unknown as QueuedCandidate[]) {
      // Claim: pending → processing. The .eq('ai_status','pending') guard makes
      // this a compare-and-swap — a concurrent processor loses and skips.
      const { data: claimed } = await supabase
        .from("candidates")
        .update({ ai_status: "processing" })
        .eq("id", row.id)
        .eq("ai_status", "pending")
        .select("id");
      if (!claimed || claimed.length === 0) continue;

      try {
        const { data: job } = await supabase
          .from("job_posts")
          .select("title, department, location, employment_type, experience_required, description, required_skills")
          .eq("id", row.job_post_id!)
          .single();
        if (!job) throw new Error("Associated job post no longer exists.");

        const pdfBase64 = await fetchResumeBase64(row.resume_url!);
        const evaluation = await evaluateResume(pdfBase64, job as Pick<JobPost,
          "title" | "department" | "location" | "employment_type" |
          "experience_required" | "description" | "required_skills">);

        const parsedNotes =
          `Experience: ${evaluation.experience}\n\nEducation: ${evaluation.education}` +
          (evaluation.certifications.length ? `\n\nCertifications: ${evaluation.certifications.join(", ")}` : "") +
          (evaluation.skills.length ? `\n\nSkills (from resume): ${evaluation.skills.join(", ")}` : "");

        await supabase
          .from("candidates")
          .update({
            ai_status:         "completed",
            ai_score:          evaluation.ai_score,
            ai_recommendation: evaluation.ai_recommendation,
            ai_reason:         evaluation.reasoning,
            ai_strengths:      evaluation.strengths,
            ai_weaknesses:     evaluation.weaknesses,
            ai_summary:        evaluation.summary,
            // Upgrade sync-time values with resume-parsed data where better.
            full_name: evaluation.full_name || row.full_name,
            // Only fill notes the sync left empty — never clobber recruiter notes.
            ...(row.notes ? {} : { notes: parsedNotes }),
          })
          .eq("id", row.id)
          .eq("ai_status", "processing");

        summary.processed++;
      } catch (err) {
        const reason = err instanceof Error ? err.message : "Unknown AI processing error";
        console.error(`[ai-queue] Candidate ${row.id} failed:`, reason);
        await supabase
          .from("candidates")
          .update({ ai_status: "failed", ai_reason: reason })
          .eq("id", row.id)
          .eq("ai_status", "processing");
        summary.failed++;
      }
    }
  } catch (err) {
    console.error("[ai-queue] Processor error:", err);
  }

  return summary;
}
