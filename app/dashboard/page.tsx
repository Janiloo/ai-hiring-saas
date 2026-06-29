import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import SectionHeader from "@/components/SectionHeader";
import StatCard from "@/components/StatCard";
import { getDashboardData } from "@/lib/queries/dashboard";
import { InterviewStatusBadge, InterviewTypeBadge } from "@/components/interviews/InterviewStatusBadge";
import CandidateStageBadge from "@/components/candidates/CandidateStageBadge";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function DashboardPage() {
  const { stats, recentCandidates, upcomingInterviews } = await getDashboardData();

  const statCards = [
    { label: "Total Candidates",      value: stats.totalCandidates, icon: "👥", change: "All time",       positive: true },
    { label: "Open Jobs",             value: stats.openJobs,        icon: "📋", change: "Active listings", positive: true },
    { label: "Interviews Today",      value: stats.interviewsToday, icon: "🗓", change: "Scheduled",       positive: true },
    { label: "Hired This Month",      value: stats.hiredThisMonth,  icon: "✅", change: "Current month",   positive: true },
  ];

  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back — here's what's happening today."
      />

      {/* Stat cards */}
      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Recent Candidates */}
        <section>
          <SectionHeader
            title="Recent Candidates"
            action={
              <Link
                href="/dashboard/candidates"
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition hover:bg-gray-50"
              >
                View all
              </Link>
            }
          />
          {recentCandidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-10 text-center">
              <p className="text-sm text-gray-500">No candidates yet.</p>
              <Link href="/dashboard/candidates/new" className="mt-2 text-xs text-indigo-600 hover:underline">
                Add your first candidate
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <ul className="divide-y divide-gray-100">
                {recentCandidates.map((c) => {
                  const initials = c.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/dashboard/candidates/${c.id}`}
                        className="flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">{c.full_name}</p>
                            <p className="truncate text-xs text-gray-500">{c.job_post?.title ?? c.email}</p>
                          </div>
                        </div>
                        <CandidateStageBadge stage={c.stage} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        {/* Upcoming Interviews */}
        <section>
          <SectionHeader
            title="Upcoming Interviews"
            action={
              <Link
                href="/dashboard/interviews"
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition hover:bg-gray-50"
              >
                View all
              </Link>
            }
          />
          {upcomingInterviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-10 text-center">
              <p className="text-sm text-gray-500">No upcoming interviews.</p>
              <Link href="/dashboard/interviews/new" className="mt-2 text-xs text-indigo-600 hover:underline">
                Schedule an interview
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <ul className="divide-y divide-gray-100">
                {upcomingInterviews.map((iv) => (
                  <li key={iv.id}>
                    <Link
                      href={`/dashboard/interviews/${iv.id}`}
                      className="flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-gray-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {iv.candidate?.full_name ?? "—"}
                        </p>
                        <p className="truncate text-xs text-gray-500">with {iv.interviewer}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <InterviewTypeBadge type={iv.interview_type} />
                        <span className="text-xs text-gray-400">{formatDateTime(iv.scheduled_at)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
