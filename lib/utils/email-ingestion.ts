import nodemailer from "nodemailer";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobPost } from "@/types/job-post";
import {
  refreshAccessToken,
  listUnreadMessages,
  getMessage,
  getAttachment,
  markAsRead,
} from "@/lib/utils/gmail";
import { processEmailEvents } from "@/lib/utils/email-events";

// ─────────────────────────────────────────────────────────────────────────────
// Email ingestion pipeline — INGESTION ONLY, no AI.
//
// RULES (enforced here, not by AI):
//  - Only process emails with a PDF resume attachment.
//  - Subject must be exactly "<Active Job Post Title> Candidate"
//    (case-insensitive, trimmed). The SUBJECT determines the job post — never AI.
//  - No match → no candidate; auto-reply with the correct format; log it.
//  - Match → store the resume PDF, create candidate in "Applied" with
//    ai_status='pending', associate with the matched job post, notify recruiters.
//  - AI evaluation runs SEPARATELY via lib/utils/ai-queue.ts (background),
//    so sync finishes fast and never blocks on the model.
//  - AI never moves pipeline stages.
// ─────────────────────────────────────────────────────────────────────────────

export interface IngestionSummary {
  checked:   number;
  created:   number;
  noMatch:   number;
  skipped:   number;
  errors:    number;
  error?:    string;
}

interface OrgRow {
  id:                    string;
  name:                  string;
  recruitment_email:     string | null;
  gmail_refresh_token:   string | null;
  created_by:            string | null;
}

function subjectToJobTitle(subject: string): string | null {
  // "<Job Title> Candidate" — case-insensitive, trimmed
  const m = subject.trim().match(/^(.+?)\s+candidate$/i);
  return m ? m[1].trim() : null;
}

/**
 * Stores an inbound resume PDF in the "resumes" bucket (same layout as manual
 * uploads in lib/actions/candidates.ts) and returns its public URL. Storing
 * the PDF is what lets AI evaluation run later, outside the sync request.
 * Returns null on failure — the candidate is still created, just not queueable.
 */
async function storeResume(pdfBase64: string, organizationId: string): Promise<string | null> {
  try {
    const { createClient: createServiceClient } = await import("@supabase/supabase-js");
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    const path = `${organizationId}/${crypto.randomUUID()}.pdf`;
    const { error } = await admin.storage
      .from("resumes")
      .upload(path, Buffer.from(pdfBase64, "base64"), {
        contentType: "application/pdf",
        upsert: false,
      });
    if (error) {
      console.error("[ingestion] Resume upload failed:", error.message);
      return null;
    }
    const { data: { publicUrl } } = admin.storage.from("resumes").getPublicUrl(path);
    return publicUrl;
  } catch (err) {
    console.error("[ingestion] Resume upload failed:", err);
    return null;
  }
}

function smtpTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST ?? "smtp.gmail.com",
    port:   Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendFormatReply(orgName: string, to: string, activeTitles: string[]) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  const transporter = smtpTransporter();
  const examples = activeTitles.slice(0, 3).map((t) => `  ${t} Candidate`).join("\n");
  await transporter.sendMail({
    from: `"${orgName}" <${process.env.SMTP_USER}>`,
    to,
    subject: "Your application could not be processed",
    text: `Hello,

Thank you for your interest in ${orgName}. Unfortunately, our automated recruitment system could not process your application because the email subject did not match an open position.

Please re-send your application with the subject line in exactly this format:

  <Job Title> Candidate
${examples ? `\nOpen positions right now:\n${examples}\n` : ""}
Also make sure your resume is attached as a PDF.

Best regards,
${orgName} Recruitment`,
  });
}

/**
 * Processes the organization's recruitment inbox once.
 * `actorUserId` is recorded as the candidate's creating user (required column).
 */
export async function ingestRecruitmentInbox(
  supabase: SupabaseClient,
  org: OrgRow,
  actorUserId: string
): Promise<IngestionSummary> {
  const summary: IngestionSummary = { checked: 0, created: 0, noMatch: 0, skipped: 0, errors: 0 };

  if (!org.gmail_refresh_token) {
    return { ...summary, error: "Gmail is not connected. An admin can connect it in Settings → Recruitment." };
  }

  let accessToken: string;
  try {
    accessToken = await refreshAccessToken(org.gmail_refresh_token);
  } catch {
    return { ...summary, error: "Gmail authorization expired. Please reconnect Gmail in Settings → Recruitment." };
  }

  // Active job posts for this org — subject matching is against these only
  const { data: jobs } = await supabase
    .from("job_posts")
    .select("*")
    .eq("organization_id", org.id)
    .eq("status", "active");
  const activeJobs = (jobs ?? []) as JobPost[];

  const messages = await listUnreadMessages(accessToken);

  for (const meta of messages) {
    summary.checked++;

    // Dedupe: skip anything already logged for this org
    const { data: existing } = await supabase
      .from("ingestion_logs")
      .select("id")
      .eq("organization_id", org.id)
      .eq("gmail_message_id", meta.id)
      .maybeSingle();
    if (existing) {
      summary.skipped++;
      continue;
    }

    const log = async (
      status: "processed" | "no_match" | "no_attachment" | "error",
      detail: string,
      extra: { from_email?: string; subject?: string; candidate_id?: string } = {}
    ) => {
      await supabase.from("ingestion_logs").insert({
        organization_id: org.id,
        gmail_message_id: meta.id,
        status,
        detail,
        ...extra,
      });
    };

    try {
      const msg = await getMessage(accessToken, meta.id);
      const base = { from_email: msg.fromEmail, subject: msg.subject };

      // Rule: must contain a PDF resume attachment
      if (!msg.pdfAttachment) {
        await log("no_attachment", "No PDF resume attached.", base);
        await markAsRead(accessToken, meta.id);
        summary.skipped++;
        continue;
      }

      // Rule: subject must be "<Job Title> Candidate" and match an ACTIVE post
      const wantedTitle = subjectToJobTitle(msg.subject);
      const job = wantedTitle
        ? activeJobs.find((j) => j.title.trim().toLowerCase() === wantedTitle.toLowerCase())
        : undefined;

      if (!job) {
        await log("no_match", wantedTitle
          ? `No active job post titled "${wantedTitle}".`
          : "Subject does not follow the '<Job Title> Candidate' format.", base);
        try {
          await sendFormatReply(org.name, msg.fromEmail, activeJobs.map((j) => j.title));
        } catch (err) {
          console.error("[ingestion] Auto-reply failed:", err);
        }
        await markAsRead(accessToken, meta.id);
        summary.noMatch++;
        continue;
      }

      // Valid application → store the resume PDF, create the candidate, and
      // QUEUE AI evaluation (ai_status='pending'). No AI runs during sync.
      const pdfBase64 = await getAttachment(accessToken, meta.id, msg.pdfAttachment.attachmentId);
      const resumeUrl = await storeResume(pdfBase64, org.id);

      const { data: candidate, error: insertError } = await supabase
        .from("candidates")
        .insert({
          user_id:         actorUserId,
          organization_id: org.id,
          job_post_id:     job.id, // determined by the email subject — never by AI
          full_name:       msg.fromName || msg.fromEmail, // upgraded by AI later
          email:           msg.fromEmail,
          phone:           null,
          resume_url:      resumeUrl,
          stage:           "applied", // pipeline stage is system-set; AI never moves stages
          applied_via:     "email",
          notes:           null, // filled by AI parsing when evaluation completes
          // Queue for background AI; if the PDF couldn't be stored there is
          // nothing for AI to read — mark failed with a reason instead of
          // leaving an unprocessable 'pending' row.
          ai_status:       resumeUrl ? "pending" : "failed",
          ai_reason:       resumeUrl ? null : "Resume PDF could not be stored during sync.",
        })
        .select("id")
        .single();

      if (insertError) {
        await log("error", `Candidate insert failed: ${insertError.message}`, base);
        summary.errors++;
        continue;
      }

      await log("processed", `Candidate created for "${job.title}" — AI evaluation queued.`, {
        ...base,
        candidate_id: candidate.id,
      });
      await markAsRead(accessToken, meta.id);
      summary.created++;
    } catch (err) {
      console.error(`[ingestion] Message ${meta.id} failed:`, err);
      await log("error", err instanceof Error ? err.message : "Unknown error");
      summary.errors++;
    }
  }

  // Deliver queued notifications (candidate confirmation + recruiter alerts).
  // The DB trigger enqueued candidate_applied events on insert.
  if (summary.created > 0) {
    await processEmailEvents(supabase);
  }

  return summary;
}
