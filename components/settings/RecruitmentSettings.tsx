"use client";

import { useActionState, useTransition, useState } from "react";
import { useSearchParams } from "next/navigation";
import { updateRecruitmentEmail, disconnectGmail, type ActionState } from "@/lib/actions/org-settings";

interface RecruitmentSettingsProps {
  recruitmentEmail:    string | null;
  gmailConnectedEmail: string | null;
}

const GMAIL_STATUS_MESSAGES: Record<string, { text: string; ok: boolean }> = {
  connected:        { text: "Gmail connected successfully.", ok: true },
  denied:           { text: "Google authorization was cancelled.", ok: false },
  state_mismatch:   { text: "Security check failed — please try connecting again.", ok: false },
  forbidden:        { text: "Only admins can connect Gmail.", ok: false },
  no_refresh_token: { text: "Google didn't return offline access. Remove the app at myaccount.google.com/permissions and try again.", ok: false },
  save_failed:      { text: "Could not save the Gmail connection.", ok: false },
  error:            { text: "Gmail connection failed. Please try again.", ok: false },
};

export default function RecruitmentSettings({
  recruitmentEmail,
  gmailConnectedEmail,
}: RecruitmentSettingsProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateRecruitmentEmail,
    null
  );
  const [isDisconnecting, startDisconnect] = useTransition();
  const [disconnectError, setDisconnectError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const gmailStatus  = searchParams.get("gmail");
  const gmailMessage = gmailStatus ? GMAIL_STATUS_MESSAGES[gmailStatus] : null;

  function handleDisconnect() {
    setDisconnectError(null);
    startDisconnect(async () => {
      const result = await disconnectGmail();
      if (result && "error" in result) setDisconnectError(result.error);
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {gmailMessage && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            gmailMessage.ok
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-red-100 bg-red-50 text-red-600"
          }`}
        >
          {gmailMessage.text}
        </div>
      )}

      {/* Recruitment Email */}
      <form action={formAction} className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-900">Recruitment Email</label>
        <p className="text-xs text-gray-500">
          Shown in AI-generated job postings as the application address. Candidates email their
          resume here with the subject <span className="font-mono">&lt;Job Title&gt; Candidate</span>.
        </p>
        <div className="mt-1 flex items-center gap-3">
          <input
            name="recruitment_email"
            type="email"
            defaultValue={recruitmentEmail ?? ""}
            placeholder="recruiting@yourcompany.com"
            className="input max-w-sm"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
        {state && "error" in state && <p className="text-xs text-red-500">{state.error}</p>}
        {state && "success" in state && <p className="text-xs text-emerald-600">{state.success}</p>}
      </form>

      {/* Gmail connection */}
      <div className="mt-6 border-t border-gray-100 pt-5">
        <p className="text-sm font-medium text-gray-900">Gmail Inbox Connection</p>
        <p className="mt-0.5 text-xs text-gray-500">
          Connect the recruitment inbox so the system can automatically ingest applications
          (PDF resume + matching subject line) and create candidates with AI evaluation.
        </p>

        <div className="mt-3 flex items-center gap-3">
          {gmailConnectedEmail ? (
            <>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Connected: {gmailConnectedEmail}
              </span>
              <button
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
              >
                {isDisconnecting ? "Disconnecting…" : "Disconnect"}
              </button>
            </>
          ) : (
            <a
              href="/api/gmail/auth"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Connect Gmail
            </a>
          )}
        </div>
        {disconnectError && <p className="mt-2 text-xs text-red-500">{disconnectError}</p>}
      </div>
    </div>
  );
}
