// ─────────────────────────────────────────────────────────────────────────────
// Minimal Gmail REST client (no googleapis dependency).
// Auth: per-organization OAuth refresh token stored in organizations table.
// Scope used: https://www.googleapis.com/auth/gmail.modify
//   (read messages + attachments, and mark processed messages as read)
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

export const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.modify";

export function gmailRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/gmail/callback`;
}

export function gmailConsentUrl(state: string): string {
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri:  gmailRedirectUri(),
    response_type: "code",
    scope:         GMAIL_SCOPE,
    access_type:   "offline",
    prompt:        "consent", // always return a refresh_token
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
}> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri:  gmailRedirectUri(),
      grant_type:    "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id:     process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type:    "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  const data = await res.json();
  return data.access_token as string;
}

async function gmailFetch(accessToken: string, path: string): Promise<unknown> {
  const res = await fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Gmail API ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function getProfileEmail(accessToken: string): Promise<string> {
  const data = (await gmailFetch(accessToken, "/profile")) as { emailAddress: string };
  return data.emailAddress;
}

export interface GmailMessageMeta {
  id: string;
}

/** Unread inbox messages with attachments (the ingestion candidates). */
export async function listUnreadMessages(accessToken: string): Promise<GmailMessageMeta[]> {
  const q = encodeURIComponent("is:unread in:inbox has:attachment");
  const data = (await gmailFetch(accessToken, `/messages?q=${q}&maxResults=25`)) as {
    messages?: { id: string }[];
  };
  return data.messages ?? [];
}

interface GmailPart {
  mimeType?: string;
  filename?: string;
  body?: { attachmentId?: string; data?: string; size?: number };
  parts?: GmailPart[];
}

export interface ParsedMessage {
  id:           string;
  subject:      string;
  fromEmail:    string;
  fromName:     string;
  pdfAttachment: { filename: string; attachmentId: string } | null;
}

export async function getMessage(accessToken: string, id: string): Promise<ParsedMessage> {
  const data = (await gmailFetch(accessToken, `/messages/${id}?format=full`)) as {
    id: string;
    payload?: GmailPart & { headers?: { name: string; value: string }[] };
  };

  const headers = data.payload?.headers ?? [];
  const header = (name: string) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

  const rawFrom = header("From"); // e.g. `Jane Doe <jane@x.com>`
  const emailMatch = rawFrom.match(/<([^>]+)>/);
  const fromEmail = (emailMatch ? emailMatch[1] : rawFrom).trim().toLowerCase();
  const fromName  = rawFrom.replace(/<[^>]+>/, "").replace(/["']/g, "").trim();

  // Walk MIME tree for the first PDF attachment
  let pdf: ParsedMessage["pdfAttachment"] = null;
  const walk = (part?: GmailPart) => {
    if (!part || pdf) return;
    const isPdf =
      part.mimeType === "application/pdf" ||
      (part.filename ?? "").toLowerCase().endsWith(".pdf");
    if (isPdf && part.filename && part.body?.attachmentId) {
      pdf = { filename: part.filename, attachmentId: part.body.attachmentId };
      return;
    }
    part.parts?.forEach(walk);
  };
  walk(data.payload);

  return { id: data.id, subject: header("Subject").trim(), fromEmail, fromName, pdfAttachment: pdf };
}

/** Returns the attachment as standard base64 (Anthropic-compatible). */
export async function getAttachment(
  accessToken: string,
  messageId: string,
  attachmentId: string
): Promise<string> {
  const data = (await gmailFetch(
    accessToken,
    `/messages/${messageId}/attachments/${attachmentId}`
  )) as { data: string };
  // Gmail returns base64url — convert to standard base64
  return data.data.replace(/-/g, "+").replace(/_/g, "/");
}

export async function markAsRead(accessToken: string, messageId: string): Promise<void> {
  const res = await fetch(`${GMAIL_API}/messages/${messageId}/modify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
  });
  if (!res.ok) throw new Error(`Failed to mark message read: ${await res.text()}`);
}
