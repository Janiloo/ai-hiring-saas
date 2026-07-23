import nodemailer from "nodemailer";
import type { SupabaseClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────────────────
// Event-driven email system (outbox pattern).
//
// Emails are NEVER composed or triggered by the UI. Database triggers write
// rows into `email_events` whenever pipeline/interview events occur. This
// processor drains pending events and delivers via SMTP. It is called from
// backend logic (server actions) after mutations — fire-and-forget, so a mail
// failure never breaks the originating action.
// ─────────────────────────────────────────────────────────────────────────────

interface EmailEvent {
  id:           string;
  candidate_id: string | null;
  event_type:   string;
  payload: {
    candidate_name?:  string;
    candidate_email?: string;
    stage?:           string;
    interview_id?:    string;
    interviewer_id?:  string;
    scheduled_at?:    string;
    rating?:          number;
    recommendation?:  string;
  };
}

function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST ?? "smtp.gmail.com",
    port:   Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

interface Mail {
  to:      string;
  subject: string;
  text:    string;
}

/** Builds the outbound emails for a single event. Returns [] for unknown events. */
function buildEmails(event: EmailEvent, recruiterEmails: string[]): Mail[] {
  const p    = event.payload;
  const name = p.candidate_name ?? "Candidate";
  const to   = p.candidate_email;

  switch (event.event_type) {
    case "candidate_applied":
      return [
        ...(to ? [{
          to,
          subject: "We received your application",
          text: `Hi ${name},\n\nThank you for applying. Our team has received your application and will review it shortly.\n\nBest regards,\nThe Hiring Team`,
        }] : []),
        ...recruiterEmails.map((r) => ({
          to: r,
          subject: `New candidate: ${name}`,
          text: `A new candidate (${name}) has applied and is now in the pipeline.`,
        })),
      ];

    case "candidate_screening":
      return to ? [{
        to,
        subject: "Your application is under review",
        text: `Hi ${name},\n\nYour application is currently being reviewed by our team. We'll be in touch soon.\n\nBest regards,\nThe Hiring Team`,
      }] : [];

    case "candidate_shortlisted":
      return to ? [{
        to,
        subject: "You've been shortlisted!",
        text: `Hi ${name},\n\nGreat news — you've been shortlisted for the next step in our hiring process. We'll contact you shortly with details.\n\nBest regards,\nThe Hiring Team`,
      }] : [];

    case "candidate_decision":
      return to ? [{
        to,
        subject: "Update on your application",
        text: `Hi ${name},\n\nYour interview process is complete and your application is now in final review. We'll share the outcome soon.\n\nBest regards,\nThe Hiring Team`,
      }] : [];

    case "candidate_hired":
      return [
        ...(to ? [{
          to,
          subject: "Congratulations — you're hired!",
          text: `Hi ${name},\n\nCongratulations! We're delighted to offer you the position. Our team will reach out with onboarding details.\n\nWelcome aboard!\nThe Hiring Team`,
        }] : []),
        ...recruiterEmails.map((r) => ({
          to: r,
          subject: `Candidate hired: ${name}`,
          text: `${name} has been marked as Hired.`,
        })),
      ];

    case "candidate_rejected":
      return to ? [{
        to,
        subject: "Update on your application",
        text: `Hi ${name},\n\nThank you for your interest and the time you invested in our process. After careful consideration, we've decided not to move forward at this time.\n\nWe wish you the best in your search.\nThe Hiring Team`,
      }] : [];

    case "interview_report_submitted":
      return recruiterEmails.map((r) => ({
        to: r,
        subject: "Interview feedback ready",
        text: `An interviewer submitted feedback (recommendation: ${p.recommendation ?? "n/a"}, rating: ${p.rating ?? "n/a"}/5). Review it in the dashboard.`,
      }));

    default:
      // interview_scheduled is handled below (needs interviewer/candidate lookups)
      return [];
  }
}

/**
 * Drains pending email_events for the caller's organization and sends them.
 * Safe to call after any mutation — never throws.
 */
export async function processEmailEvents(supabase: SupabaseClient): Promise<void> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

    const { data: events } = await supabase
      .from("email_events")
      .select("id, candidate_id, event_type, payload, organization_id")
      .eq("status", "pending")
      .limit(20);

    if (!events || events.length === 0) return;

    const orgId = events[0].organization_id as string;

    // Recruiter/admin notification recipients for this org
    const { data: members } = await supabase.rpc("get_org_members_with_profiles", {
      p_org_id: orgId,
    });
    const allMembers = (members ?? []) as Array<{ role: string; email: string }>;
    // Staff alerts (hired, reports, etc.): admins + recruiters. Never interviewers.
    const recruiterEmails = allMembers
      .filter((m) => m.role === "admin" || m.role === "recruiter")
      .map((m) => m.email);
    // New-application alerts: recruiters only (admins only when the org has no
    // recruiters, so someone is always notified). Never interviewers.
    const recruitersOnly = allMembers.filter((m) => m.role === "recruiter").map((m) => m.email);
    const applicationAlertEmails = recruitersOnly.length > 0 ? recruitersOnly : recruiterEmails;

    const transporter = createTransporter();
    const from = `"Makes" <${process.env.SMTP_USER}>`;

    for (const event of events as unknown as (EmailEvent & { organization_id: string })[]) {
      let mails = buildEmails(
        event,
        event.event_type === "candidate_applied" ? applicationAlertEmails : recruiterEmails
      );

      // interview_scheduled needs candidate + interviewer lookups
      if (event.event_type === "interview_scheduled") {
        const [{ data: candidate }, interviewerEmail] = await Promise.all([
          event.candidate_id
            ? supabase.from("candidates").select("full_name, email").eq("id", event.candidate_id).maybeSingle()
            : Promise.resolve({ data: null }),
          (async () => {
            const iid = event.payload.interviewer_id;
            if (!iid) return null;
            const m = ((members ?? []) as Array<{ user_id: string; email: string }>).find((x) => x.user_id === iid);
            return m?.email ?? null;
          })(),
        ]);

        const when = event.payload.scheduled_at
          ? new Date(event.payload.scheduled_at).toLocaleString("en-US", {
              month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
            })
          : "TBD";

        mails = [
          ...(candidate?.email ? [{
            to: candidate.email,
            subject: "Your interview has been scheduled",
            text: `Hi ${candidate.full_name},\n\nYour interview has been scheduled for ${when}. You'll receive meeting details separately.\n\nBest regards,\nThe Hiring Team`,
          }] : []),
          ...(interviewerEmail ? [{
            to: interviewerEmail,
            subject: "You've been assigned an interview",
            text: `You have been assigned to interview ${candidate?.full_name ?? "a candidate"} on ${when}. Check the dashboard for details.`,
          }] : []),
        ];
      }

      let allSent = true;
      for (const mail of mails) {
        try {
          await transporter.sendMail({ from, ...mail });
        } catch (err) {
          console.error(`[email-events] Failed to send "${event.event_type}" to ${mail.to}:`, err);
          allSent = false;
        }
      }

      await supabase
        .from("email_events")
        .update({
          status:  allSent ? "sent" : "failed",
          sent_at: allSent ? new Date().toISOString() : null,
        })
        .eq("id", event.id);
    }
  } catch (err) {
    // Email processing must never break the calling action
    console.error("[email-events] Processing error:", err);
  }
}
