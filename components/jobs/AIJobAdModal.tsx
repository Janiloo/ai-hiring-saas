"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { generateJobAd, type JobAdInput } from "@/lib/actions/ai-job-post";

interface AIJobAdModalProps {
  job: JobAdInput;
}

export default function AIJobAdModal({ job }: AIJobAdModalProps) {
  const router = useRouter();
  const [ad, setAd]           = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);

  // All setState here happens after the await (async continuation), which
  // keeps the initial-mount effect free of synchronous setState.
  const run = useCallback(async () => {
    const result = await generateJobAd(job);
    if (result.error) setError(result.error);
    else setAd(result.ad ?? null);
    setLoading(false);
  }, [job]);

  useEffect(() => {
    // Data fetch on mount — all setState happens after the await resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void run();
  }, [run]);

  function generate() {
    setLoading(true);
    setError(null);
    setCopied(false);
    void run();
  }

  async function handleCopy() {
    if (!ad) return;
    await navigator.clipboard.writeText(ad);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    router.push("/dashboard/jobs");
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">AI Generated Job Posting</h2>
            <p className="text-xs text-gray-500">
              Job post saved. Copy this advertisement to LinkedIn, Indeed, JobStreet, Facebook Jobs, or your careers page.
            </p>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <p className="text-sm text-gray-500">Writing your job advertisement…</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : (
            <pre className="whitespace-pre-wrap rounded-lg border border-gray-100 bg-gray-50 p-4 font-sans text-sm leading-relaxed text-gray-800">
              {ad}
            </pre>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={generate}
            disabled={loading}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? "Generating…" : "Regenerate with AI"}
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              disabled={loading || !ad}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
            <button
              onClick={handleClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
