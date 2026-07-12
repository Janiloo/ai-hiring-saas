"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { MATCH_TIER_META, type MatchTier } from "@/types/candidate";

const TIERS: (MatchTier | "all")[] = [
  "all",
  "strong_match",
  "recommended",
  "needs_review",
  "not_recommended",
];

interface Props {
  jobs: { id: string; title: string }[];
  counts: Record<MatchTier | "all", number>;
}

// Filter bar for the AI Recommendations page. All state lives in the URL so
// the server page runs the filtered query — no client-side data fetching.
export default function AiRecommendationFilters({ jobs, counts }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function setParam(name: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "all") next.set(name, value);
    else next.delete(name);
    router.push(next.toString() ? `${pathname}?${next.toString()}` : pathname);
  }

  const activeTier = (params.get("tier") ?? "all") as MatchTier | "all";
  const currentQuery = params.get("q") ?? "";

  function submitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setParam("q", new FormData(e.currentTarget).get("q")?.toString().trim() ?? "");
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tier tabs */}
      <div className="flex flex-wrap gap-2">
        {TIERS.map((tier) => {
          const active = activeTier === tier;
          const label = tier === "all" ? "All Evaluated" : MATCH_TIER_META[tier].label;
          return (
            <button
              key={tier}
              type="button"
              onClick={() => setParam("tier", tier)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900"
              }`}
            >
              {label}
              <span className={`ml-1.5 ${active ? "text-indigo-200" : "text-gray-400"}`}>
                {counts[tier]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Job / score / skills filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={params.get("job") ?? "all"}
          onChange={(e) => setParam("job", e.target.value)}
          className="input sm:w-56"
          aria-label="Filter by job post"
        >
          <option value="all">All job posts</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>{j.title}</option>
          ))}
        </select>

        <select
          value={params.get("min") ?? "all"}
          onChange={(e) => setParam("min", e.target.value)}
          className="input sm:w-44"
          aria-label="Minimum match score"
        >
          <option value="all">Any score</option>
          <option value="90">Score ≥ 90</option>
          <option value="80">Score ≥ 80</option>
          <option value="70">Score ≥ 70</option>
          <option value="50">Score ≥ 50</option>
        </select>

        <form onSubmit={submitSearch} className="flex-1">
          <input
            key={currentQuery}
            type="search"
            name="q"
            defaultValue={currentQuery}
            placeholder="Search skills, experience, or name… (press Enter)"
            className="input w-full"
            aria-label="Search skills, experience, or name"
          />
        </form>
      </div>
    </div>
  );
}
