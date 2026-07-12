import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/ui/Icon";
import AiRecommendationFilters from "@/components/candidates/AiRecommendationFilters";
import AutoRefresh from "@/components/AutoRefresh";
import CandidateStageBadge from "@/components/candidates/CandidateStageBadge";
import { getAiRecommendedCandidates } from "@/lib/queries/candidates";
import { getJobPosts } from "@/lib/queries/job-posts";
import { getUserOrganization } from "@/lib/queries/invitations";
import {
  matchTier,
  MATCH_TIER_META,
  STRONG_MATCH_MIN_SCORE,
  type MatchTier,
} from "@/types/candidate";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ tier?: string; job?: string; min?: string; q?: string }>;
}

function scoreColor(score: number) {
  if (score >= STRONG_MATCH_MIN_SCORE) return "text-indigo-700 bg-indigo-50 border-indigo-200";
  if (score >= 50) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-red-700 bg-red-50 border-red-200";
}

export default async function AiRecommendationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tier = (params.tier ?? "all") as MatchTier | "all";
  const job = params.job ?? "all";
  const min = params.min && params.min !== "all" ? parseInt(params.min, 10) : undefined;
  const q = params.q ?? "";

  const orgResult = await getUserOrganization();
  const role = orgResult?.member.role ?? null;
  // Ranking data informs recruitment decisions — recruiter/admin only.
  if (role !== "admin" && role !== "recruiter") redirect("/dashboard");

  const [candidates, allEvaluated, { data: jobs }] = await Promise.all([
    getAiRecommendedCandidates({ tier, job_post_id: job, minScore: min, query: q }),
    getAiRecommendedCandidates({}), // unfiltered — for tier counts
    getJobPosts({ page: 1 }),
  ]);

  const counts: Record<MatchTier | "all", number> = {
    all: allEvaluated.length,
    strong_match: 0,
    recommended: 0,
    needs_review: 0,
    not_recommended: 0,
  };
  for (const c of allEvaluated) {
    const t = matchTier(c.ai_recommendation, c.ai_score);
    if (t) counts[t]++;
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <AutoRefresh />
      <PageHeader
        title="AI Recommendations"
        subtitle="Candidates ranked by AI evaluation. AI informs — recruiters and admins decide; pipeline moves stay manual."
      />

      <Suspense>
        <AiRecommendationFilters
          jobs={jobs.map((j) => ({ id: j.id, title: j.title }))}
          counts={counts}
        />
      </Suspense>

      {candidates.length === 0 ? (
        <div className="card flex flex-col items-center justify-center border-dashed py-14 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <Icon name="sparkles" size={20} />
          </span>
          <p className="mt-3 text-sm font-medium text-gray-500">No evaluated candidates match these filters.</p>
          <p className="mt-1 text-xs text-gray-400">
            Candidates appear here once background AI evaluation completes after a sync.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {candidates.map((c) => {
            const t = matchTier(c.ai_recommendation, c.ai_score);
            const tierMeta = t ? MATCH_TIER_META[t] : null;
            return (
              <Link
                key={c.id}
                href={`/dashboard/candidates/${c.id}`}
                className="group card flex items-center justify-between gap-4 px-5 py-4 transition-shadow hover:shadow-md"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  {/* Score */}
                  <div
                    className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border text-center ${scoreColor(c.ai_score ?? 0)}`}
                  >
                    <span className="text-base font-bold leading-none">{c.ai_score}</span>
                    <span className="mt-0.5 text-[9px] font-medium uppercase leading-none opacity-70">score</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-gray-900">{c.full_name}</p>
                      {tierMeta && (
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${tierMeta.color}`}>
                          {tierMeta.label}
                        </span>
                      )}
                    </div>
                    {c.job_post && (
                      <p className="truncate text-xs text-indigo-600">{c.job_post.title}</p>
                    )}
                    {c.ai_summary && (
                      <p className="mt-1 line-clamp-2 max-w-2xl text-xs text-gray-500">{c.ai_summary}</p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <CandidateStageBadge stage={c.stage} />
                  <Icon name="chevron-right" size={16} className="text-gray-300 transition group-hover:text-gray-400" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
