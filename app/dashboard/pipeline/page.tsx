import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PipelineCard from "@/components/pipeline/PipelineCard";
import { getCandidatesGroupedByStage } from "@/lib/queries/pipeline";
import { STAGE_ORDER, STAGE_META } from "@/types/candidate";

const COLUMN_COLORS: Record<string, string> = {
  applied:              "border-t-blue-400",
  screening:            "border-t-yellow-400",
  shortlisted:          "border-t-indigo-400",
  interview_scheduled:  "border-t-purple-400",
  interview_completed:  "border-t-orange-400",
  offer_sent:           "border-t-teal-400",
  hired:                "border-t-emerald-400",
  rejected:             "border-t-red-400",
};

export default async function PipelinePage() {
  const groups = await getCandidatesGroupedByStage();
  const totalCandidates = STAGE_ORDER.reduce((sum, s) => sum + groups[s].length, 0);

  return (
    <div className="flex flex-col gap-6 p-8 min-h-full">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Hiring Pipeline"
          subtitle={`${totalCandidates} candidate${totalCandidates !== 1 ? "s" : ""} across all stages`}
        />
        <Link
          href="/dashboard/candidates/new"
          className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
        >
          + Add Candidate
        </Link>
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4" style={{ minWidth: `${STAGE_ORDER.length * 220}px` }}>
          {STAGE_ORDER.map((stage) => {
            const cards = groups[stage];
            const { label } = STAGE_META[stage];
            const topColor = COLUMN_COLORS[stage] ?? "border-t-gray-400";

            return (
              <div
                key={stage}
                className={`flex w-52 shrink-0 flex-col rounded-xl border border-gray-200 bg-gray-50 border-t-2 ${topColor}`}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-700">{label}</span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 overflow-y-auto p-2" style={{ maxHeight: "calc(100vh - 280px)" }}>
                  {cards.length === 0 ? (
                    <p className="py-6 text-center text-xs text-gray-300">Empty</p>
                  ) : (
                    cards.map((c) => <PipelineCard key={c.id} candidate={c} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
