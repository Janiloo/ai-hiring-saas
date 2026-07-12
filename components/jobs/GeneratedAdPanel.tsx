"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { regenerateJobAd, saveGeneratedAd } from "@/lib/actions/ai-job-post";
import Icon from "@/components/ui/Icon";

interface GeneratedAdPanelProps {
  jobId: string;
  ad: string | null;
  generatedAt: string | null;
  /** Interviewers get read-only (no edit/regenerate). */
  canManage: boolean;
}

// The persisted AI job advertisement: copy, edit in place, or regenerate from
// the job's current fields (with confirmation before replacing).
export default function GeneratedAdPanel({ jobId, ad, generatedAt, canManage }: GeneratedAdPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing]       = useState(false);
  const [draft, setDraft]           = useState(ad ?? "");
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied]         = useState(false);
  const [error, setError]           = useState<string | null>(null);

  async function handleCopy() {
    if (!ad) return;
    await navigator.clipboard.writeText(ad);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveGeneratedAd(jobId, draft);
      if (result.error) setError(result.error);
      else {
        setEditing(false);
        router.refresh();
      }
    });
  }

  function handleRegenerate() {
    setError(null);
    startTransition(async () => {
      const result = await regenerateJobAd(jobId);
      if (result.error) setError(result.error);
      else {
        setConfirming(false);
        setEditing(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-3.5">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Icon name="sparkles" size={15} className="text-indigo-500" />
            AI Generated Job Posting
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">
            {ad
              ? generatedAt
                ? `Generated ${new Date(generatedAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}`
                : "Saved with this job post"
              : "No advertisement generated yet."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {ad && !editing && (
            <button type="button" onClick={handleCopy} className="btn-secondary btn-sm">
              {copied ? "Copied!" : "Copy"}
            </button>
          )}
          {canManage && ad && !editing && (
            <button
              type="button"
              onClick={() => { setDraft(ad); setEditing(true); setConfirming(false); }}
              className="btn-secondary btn-sm"
            >
              Edit
            </button>
          )}
          {canManage && !editing && (
            <button
              type="button"
              onClick={() => (ad ? setConfirming(true) : handleRegenerate())}
              disabled={isPending}
              className="btn-primary btn-sm"
            >
              {isPending ? "Generating…" : ad ? "Regenerate AI Job Post" : "Generate AI Job Post"}
            </button>
          )}
        </div>
      </div>

      <div className="px-5 py-4">
        {error && (
          <p role="alert" className="mb-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Regenerate confirmation — replaces existing content */}
        {confirming && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">
              Regenerating will use this job post&apos;s <strong>current fields</strong> and{" "}
              <strong>replace the existing generated content</strong> (including any manual edits).
              Continue?
            </p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={handleRegenerate} disabled={isPending} className="btn-primary btn-sm">
                {isPending ? "Generating…" : "Yes, regenerate"}
              </button>
              <button type="button" onClick={() => setConfirming(false)} disabled={isPending} className="btn-secondary btn-sm">
                Cancel
              </button>
            </div>
          </div>
        )}

        {editing ? (
          <div className="flex flex-col gap-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={16}
              className="input w-full font-sans text-sm leading-relaxed"
              aria-label="Edit generated job posting"
            />
            <div className="flex gap-2">
              <button type="button" onClick={handleSave} disabled={isPending} className="btn-primary btn-sm">
                {isPending ? "Saving…" : "Save changes"}
              </button>
              <button type="button" onClick={() => setEditing(false)} disabled={isPending} className="btn-secondary btn-sm">
                Cancel
              </button>
            </div>
          </div>
        ) : ad ? (
          <pre className="max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-lg border border-gray-100 bg-gray-50 p-4 font-sans text-sm leading-relaxed text-gray-800">
            {ad}
          </pre>
        ) : (
          <p className="py-6 text-center text-sm text-gray-400">
            {canManage
              ? "Generate a professional advertisement from this job post's details."
              : "No advertisement has been generated for this job post."}
          </p>
        )}
      </div>
    </div>
  );
}
