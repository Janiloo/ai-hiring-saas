import PageHeader from "@/components/PageHeader";
import SectionHeader from "@/components/SectionHeader";
import StatCard from "@/components/StatCard";
import { getDashboardData } from "@/lib/queries/dashboard";
import { STAGE_ORDER, STAGE_META } from "@/types/candidate";

export default async function ReportsPage() {
  const { stats, stageCounts } = await getDashboardData();

  const total = stats.totalCandidates;

  const reportStats = [
    { label: "Total Candidates", value: total,                icon: "👥", change: "All time",     positive: true },
    { label: "Open Jobs",        value: stats.openJobs,       icon: "📋", change: "Active",       positive: true },
    { label: "Hired This Month", value: stats.hiredThisMonth, icon: "✅", change: "Current month", positive: true },
    { label: "Interviews Today", value: stats.interviewsToday,icon: "🗓", change: "Scheduled",    positive: true },
  ];

  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title="Reports"
        subtitle="Track hiring performance, pipeline health, and team metrics."
      />

      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {reportStats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Hiring Funnel" />
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {total === 0 ? (
            <p className="text-center text-sm text-gray-400 py-4">No candidate data yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {STAGE_ORDER.map((stage) => {
                const count = stageCounts[stage] ?? 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const { label } = STAGE_META[stage];
                return (
                  <div key={stage}>
                    <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{label}</span>
                      <span>{count} candidate{count !== 1 ? "s" : ""} · {pct}%</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-gray-100">
                      <div
                        className="h-2.5 rounded-full bg-indigo-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
