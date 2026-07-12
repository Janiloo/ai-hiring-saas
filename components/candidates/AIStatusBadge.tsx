import { AI_STATUS_META, type AIStatus } from "@/types/candidate";

// Shows where a candidate sits in the background AI evaluation queue.
// Manual candidates without a queued evaluation (ai_status null) render nothing.
export default function AIStatusBadge({ status }: { status: AIStatus | null }) {
  if (!status) return null;
  const meta = AI_STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${meta.color}`}
      title={status === "failed" ? "AI evaluation failed — will retry on next sync" : undefined}
    >
      {meta.pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-500" />
        </span>
      )}
      {meta.label}
    </span>
  );
}
