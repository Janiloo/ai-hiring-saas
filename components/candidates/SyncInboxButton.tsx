"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { syncRecruitmentInbox } from "@/lib/actions/email-ingestion";

export default function SyncInboxButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  function handleSync() {
    setMessage(null);
    startTransition(async () => {
      const result = await syncRecruitmentInbox();
      if (result.error) {
        setMessage({ text: result.error, ok: false });
        return;
      }
      const parts: string[] = [];
      if (result.created) parts.push(`${result.created} candidate${result.created > 1 ? "s" : ""} created`);
      if (result.noMatch) parts.push(`${result.noMatch} unmatched (auto-replied)`);
      if (result.errors)  parts.push(`${result.errors} failed`);
      setMessage({
        text: parts.length ? parts.join(" · ") : "Inbox checked — no new applications.",
        ok: result.errors === 0,
      });
      if (result.created > 0) router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        onClick={handleSync}
        disabled={isPending}
        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
      >
        {isPending ? "Syncing inbox…" : "↻ Sync Inbox"}
      </button>
      {message && (
        <p
          className={`absolute right-0 top-full mt-1 w-64 text-right text-xs ${
            message.ok ? "text-gray-500" : "text-red-500"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
