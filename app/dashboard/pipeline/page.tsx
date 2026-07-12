import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PipelineCard from "@/components/pipeline/PipelineCard";
import Icon from "@/components/ui/Icon";
import AutoRefresh from "@/components/AutoRefresh";
import { getCandidatesGroupedByStage } from "@/lib/queries/pipeline";
import { STAGE_ORDER, STAGE_META, type CandidateStage } from "@/types/candidate";

// Each stage owns a spectrum hue — the SAME hue as its paint-chip badge, so a
// stage reads identically on a badge, a kanban lane cap, and the distribution bar.
const STAGE_HUE: Record<CandidateStage, string> = {
  applied:     "var(--hue-sky)",
  screening:   "var(--hue-amber)",
  shortlisted: "var(--hue-pink)",
  interview:   "var(--hue-steel)",
  decision:    "var(--hue-navy)",
  hired:       "var(--hue-green)",
  rejected:    "var(--hue-red)",
};

export default async function PipelinePage() {
  const groups = await getCandidatesGroupedByStage();
  const counts = Object.fromEntries(
    STAGE_ORDER.map((s) => [s, groups[s].length])
  ) as Record<CandidateStage, number>;

  const totalCandidates = STAGE_ORDER.reduce((sum, s) => sum + counts[s], 0);
  const hired    = counts.hired;
  const rejected = counts.rejected;
  const active   = totalCandidates - hired - rejected;

  return (
    <div className="flex h-full flex-col gap-6 p-8">
      <AutoRefresh />
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Hiring Pipeline"
          subtitle={`${totalCandidates} candidate${totalCandidates !== 1 ? "s" : ""} across all stages`}
        />
        <Link href="/dashboard/candidates/new" className="btn-primary shrink-0">
          <Icon name="user-plus" size={16} />
          Add candidate
        </Link>
      </div>

      {/* Kanban board — columns flex to fit the width; lanes fill the height. */}
      <div className="min-h-0 flex-1 overflow-x-auto">
        <div className="flex h-full gap-2">
          {STAGE_ORDER.map((stage) => {
            const cards = groups[stage];
            const { label } = STAGE_META[stage];

            return (
              <div
                key={stage}
                className="flex h-full min-w-[112px] flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
              >
                {/* Stage-hue cap */}
                <div className="h-1 w-full shrink-0" style={{ background: STAGE_HUE[stage] }} />
                {/* Column header */}
                <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2.5">
                  <span className="truncate text-xs font-bold uppercase tracking-wide text-gray-600">{label}</span>
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full border border-gray-200 bg-white px-1.5 text-xs font-semibold text-gray-600">
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                {cards.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center p-3">
                    <div className="flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-2 py-6 text-center text-gray-400">
                      <Icon name="user-plus" size={18} />
                      <span className="text-xs">No candidates yet</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
                    {cards.map((c) => (
                      <PipelineCard key={c.id} candidate={c} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage distribution */}
      <div className="shrink-0 border-t border-gray-200 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-600">Stage distribution</span>
          <span className="text-xs text-gray-400">
            {active} active · {hired} hired · {rejected} rejected
          </span>
        </div>
        {totalCandidates === 0 ? (
          <div className="h-2 rounded-full bg-gray-100" />
        ) : (
          <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
            {STAGE_ORDER.filter((s) => counts[s] > 0).map((stage) => (
              <div
                key={stage}
                style={{ flexGrow: counts[stage], background: STAGE_HUE[stage] }}
                title={`${STAGE_META[stage].label}: ${counts[stage]}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
