import nodemailer from "nodemailer";

interface InvitationEmailParams {
  to:        string;
  orgName:   string;
  role:      string;
  inviteUrl: string;
}

function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST ?? "smtp.gmail.com",
    port:   Number(process.env.SMTP_PORT ?? 587),
    secure: false, // STARTTLS on port 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendInvitationEmail({
  to,
  orgName,
  role,
  inviteUrl,
}: InvitationEmailParams): Promise<void> {
  const from = process.env.SMTP_USER;

  if (!from || !process.env.SMTP_PASS) {
    console.warn("[sendInvitationEmail] SMTP_USER or SMTP_PASS not set — skipping email send.");
    console.log("[sendInvitationEmail] Would send to:", to);
    console.log("[sendInvitationEmail] Accept URL:", inviteUrl);
    return;
  }

  const transporter = createTransporter();

  const roleLabel =
    role === "admin"       ? "Admin"       :
    role === "recruiter"   ? "Recruiter"   :
    role === "interviewer" ? "Interviewer" : role;

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
      <h2 style="font-size:20px;margin-bottom:8px">You've been invited to join ${orgName}</h2>
      <p style="color:#555;margin-bottom:24px">
        You have been invited as a <strong>${roleLabel}</strong> on Autome.
        Click the button below to accept your invitation.
      </p>
      <a href="${inviteUrl}"
         style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;
                border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
        Accept Invitation
      </a>
      <p style="margin-top:24px;font-size:12px;color:#999">
        Or copy this link into your browser:<br/>
        <a href="${inviteUrl}" style="color:#4f46e5">${inviteUrl}</a>
      </p>
      <p style="margin-top:16px;font-size:12px;color:#bbb">
        This invitation expires in 7 days. If you did not expect this email, you can safely ignore it.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from:    `"Autome" <${from}>`,
      to,
      subject: `You're invited to join ${orgName} on Autome`,
      html,
      text:    `You've been invited to join ${orgName} as ${roleLabel}.\n\nAccept here: ${inviteUrl}\n\nThis link expires in 7 days.`,
    });
    console.log("[sendInvitationEmail] Sent to:", to);
  } catch (err) {
    // Log but never throw — a failed email must not block invitation creation
    console.error("[sendInvitationEmail] Failed to send email:", err);
  }
}
