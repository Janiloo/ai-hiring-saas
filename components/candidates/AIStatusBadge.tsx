import type { AIStatus } from "@/types/candidate";

const LABELS: Record<AIStatus, string> = {
  pending:    "AI queued",
  processing: "AI processing",
  completed:  "AI evaluated",
  failed:     "AI failed",
};

// Paint-chip badge for the background AI evaluation queue (.chip-ai-* in
// globals.css). Manual candidates without a queued evaluation render nothing.
export default function AIStatusBadge({ status }: { status: AIStatus | null }) {
  if (!status) return null;
  return (
    <span
      className={`chip-ai-${status}`}
      title={status === "failed" ? "AI evaluation failed — will retry on next sync" : undefined}
    >
      {status === "processing" && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {LABELS[status]}
    </span>
  );
}
