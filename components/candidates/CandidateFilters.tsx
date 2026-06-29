"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { STAGE_ORDER, STAGE_META, type CandidateStage } from "@/types/candidate";

interface JobOption {
  id: string;
  title: string;
}

interface CandidateFiltersProps {
  jobs: JobOption[];
}

export default function CandidateFilters({ jobs }: CandidateFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentStage = searchParams.get("stage") ?? "all";
  const currentJob = searchParams.get("job") ?? "all";
  const currentQuery = searchParams.get("q") ?? "";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === "all") params.delete(key);
        else params.set(key, value);
      });
      params.delete("page");
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative">
        <svg className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by name or email…"
          defaultValue={currentQuery}
          onChange={(e) => updateParams({ q: e.target.value })}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:w-64"
        />
      </div>

      {/* Stage filter */}
      <select
        value={currentStage}
        onChange={(e) => updateParams({ stage: e.target.value })}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="all">All stages</option>
        {STAGE_ORDER.map((s: CandidateStage) => (
          <option key={s} value={s}>{STAGE_META[s].label}</option>
        ))}
      </select>

      {/* Job filter */}
      {jobs.length > 0 && (
        <select
          value={currentJob}
          onChange={(e) => updateParams({ job: e.target.value })}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="all">All jobs</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>{j.title}</option>
          ))}
        </select>
      )}
    </div>
  );
}
