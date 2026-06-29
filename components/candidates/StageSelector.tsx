"use client";

import { useTransition, useState } from "react";
import { STAGE_META, STAGE_ORDER, type CandidateStage } from "@/types/candidate";
import { updateCandidateStage } from "@/lib/actions/candidates";

interface StageSelectorProps {
  candidateId: string;
  currentStage: CandidateStage;
}

export default function StageSelector({ candidateId, currentStage }: StageSelectorProps) {
  const [stage, setStage] = useState<CandidateStage>(currentStage);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as CandidateStage;
    setStage(next);
    setError(null);
    startTransition(async () => {
      const result = await updateCandidateStage(candidateId, next);
      if (result?.error) {
        setStage(currentStage);
        setError(result.error);
      }
    });
  }

  const { color } = STAGE_META[stage];

  return (
    <div className="flex flex-col gap-1">
      <select
        value={stage}
        onChange={handleChange}
        disabled={isPending}
        className={`rounded-lg border px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 cursor-pointer ${color}`}
      >
        {STAGE_ORDER.map((s) => (
          <option key={s} value={s} className="bg-white text-gray-900 font-normal">
            {STAGE_META[s].label}
          </option>
        ))}
      </select>
      {isPending && (
        <p className="text-xs text-gray-400">Saving…</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
