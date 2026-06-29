"use client";

import { useActionState } from "react";
import type { EmailDraft } from "@/types/email-draft";
import { EMAIL_DRAFT_TYPE_LABELS, EMAIL_DRAFT_STATUS_META } from "@/types/email-draft";
import { approveDraft, rejectDraft } from "@/lib/actions/email-drafts";

type ActionState = { error: string } | null;

interface Props {
  draft: EmailDraft;
}

export default function EmailDraftCard({ draft }: Props) {
  const [approveState, approveAction, isApproving] = useActionState<ActionState, FormData>(approveDraft, null);
  const [rejectState,  rejectAction,  isRejecting]  = useActionState<ActionState, FormData>(rejectDraft,  null);

  const { label: statusLabel, color: statusColor } = EMAIL_DRAFT_STATUS_META[draft.approval_status];
  const typeLabel = EMAIL_DRAFT_TYPE_LABELS[draft.email_type];
  const isPending = draft.approval_status === "pending";
  const isBusy    = isApproving || isRejecting;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
            {typeLabel}
          </span>
          <p className="truncate text-sm font-medium text-gray-900">{draft.subject}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Body preview */}
      <div className="px-4 py-3">
        <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
          {draft.body}
        </p>
      </div>

      {/* Footer: error + action buttons */}
      <div className="border-t border-gray-100 px-4 py-3">
        {(approveState?.error || rejectState?.error) && (
          <p className="mb-2 text-xs text-red-600">
            {approveState?.error ?? rejectState?.error}
          </p>
        )}

        {isPending ? (
          <div className="flex items-center gap-2">
            {/* Approve */}
            <form action={approveAction}>
              <input type="hidden" name="id"           value={draft.id} />
              <input type="hidden" name="candidate_id" value={draft.candidate_id} />
              <button
                type="submit"
                disabled={isBusy}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {isApproving ? "Approving…" : "Approve"}
              </button>
            </form>

            {/* Reject */}
            <form action={rejectAction}>
              <input type="hidden" name="id"           value={draft.id} />
              <input type="hidden" name="candidate_id" value={draft.candidate_id} />
              <button
                type="submit"
                disabled={isBusy}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
              >
                {isRejecting ? "Rejecting…" : "Reject"}
              </button>
            </form>
          </div>
        ) : (
          <p className="text-xs text-gray-400">
            {draft.approval_status === "approved" && draft.approved_at
              ? `Approved ${new Date(draft.approved_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              : draft.approval_status === "sent" && draft.sent_at
              ? `Sent ${new Date(draft.sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              : `Status: ${statusLabel}`}
          </p>
        )}
      </div>
    </div>
  );
}
