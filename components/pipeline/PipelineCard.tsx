"use client";

import Link from "next/link";
import { useTransition, useState } from "react";
import { STAGE_META, STAGE_ORDER, type CandidateStage, type CandidateWithJob } from "@/types/candidate";
import { updateCandidateStage } from "@/lib/actions/candidates";

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function PipelineCard({ candidate }: { candidate: CandidateWithJob }) {
  const [stage, setStage] = useState<CandidateStage>(candidate.stage);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleStageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as CandidateStage;
    setStage(next);
    setError(null);
    startTransition(async () => {
      const result = await updateCandidateStage(candidate.id, next);
      if (result?.error) {
        setStage(candidate.stage);
        setError(result.error);
      }
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
            {initials(candidate.full_name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-gray-900">{candidate.full_name}</p>
            <p className="truncate text-xs text-gray-400">{candidate.email}</p>
          </div>
        </div>
        <Link
          href={`/dashboard/candidates/${candidate.id}`}
          className="shrink-0 text-xs text-gray-300 hover:text-indigo-600 transition-colors"
          title="View candidate"
        >
          →
        </Link>
      </div>

      {candidate.job_post && (
        <p className="mt-2 truncate rounded bg-gray-50 px-1.5 py-0.5 text-xs text-gray-500">
          {candidate.job_post.title}
        </p>
      )}

      <div className="mt-2">
        <select
          value={stage}
          onChange={handleStageChange}
          disabled={isPending}
          className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 focus:border-indigo-400 focus:outline-none disabled:opacity-50 cursor-pointer"
        >
          {STAGE_ORDER.map((s) => (
            <option key={s} value={s}>{STAGE_META[s].label}</option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}
