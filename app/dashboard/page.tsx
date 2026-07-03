import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import SectionHeader from "@/components/SectionHeader";
import StatCard from "@/components/StatCard";
import Icon, { type IconName } from "@/components/ui/Icon";
import { getDashboardData } from "@/lib/queries/dashboard";
import { InterviewTypeBadge } from "@/components/interviews/InterviewStatusBadge";
import CandidateStageBadge from "@/components/candidates/CandidateStageBadge";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ViewAllLink({ href }: { href: string }) {
  return (
    <Link href={href} className="btn-secondary btn-sm">
      View all
      <Icon name="arrow-right" size={14} />
    </Link>
  );
}

function EmptyState({
  icon,
  message,
  ctaHref,
  ctaLabel,
}: {
  icon: IconName;
  message: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="card flex flex-col items-center justify-center border-dashed py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <Icon name={icon} size={20} />
      </span>
      <p className="mt-3 text-sm text-gray-500">{message}</p>
      <Link href={ctaHref} className="mt-2 text-xs font-medium text-indigo-600 hover:underline">
        {ctaLabel}
      </Link>
    </div>
  );
}

export default async function DashboardPage() {
  const { stats, recentCandidates, upcomingInterviews } = await getDashboardData();

  const statCards: { label: string; value: number; icon: IconName; hint: string }[] = [
    { label: "Total Candidates", value: stats.totalCandidates, icon: "users",        hint: "All time" },
    { label: "Open Jobs",        value: stats.openJobs,        icon: "briefcase",    hint: "Active listings" },
    { label: "Interviews Today", value: stats.interviewsToday, icon: "calendar",     hint: "Scheduled" },
    { label: "Hired This Month", value: stats.hiredThisMonth,  icon: "check-circle", hint: "Current month" },
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
            action={<ViewAllLink href="/dashboard/candidates" />}
          />
          {recentCandidates.length === 0 ? (
            <EmptyState
              icon="user-plus"
              message="No candidates yet."
              ctaHref="/dashboard/candidates/new"
              ctaLabel="Add your first candidate"
            />
          ) : (
            <div className="card overflow-hidden">
              <ul className="divide-y divide-gray-100">
                {recentCandidates.map((c) => {
                  const initials = c.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/dashboard/candidates/${c.id}`}
                        className="group flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-gray-50"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">{c.full_name}</p>
                            <p className="truncate text-xs text-gray-500">{c.job_post?.title ?? c.email}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <CandidateStageBadge stage={c.stage} />
                          <Icon
                            name="chevron-right"
                            size={16}
                            className="text-gray-300 transition group-hover:text-gray-400"
                          />
                        </div>
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
            action={<ViewAllLink href="/dashboard/interviews" />}
          />
          {upcomingInterviews.length === 0 ? (
            <EmptyState
              icon="calendar-plus"
              message="No upcoming interviews."
              ctaHref="/dashboard/interviews/new"
              ctaLabel="Schedule an interview"
            />
          ) : (
            <div className="card overflow-hidden">
              <ul className="divide-y divide-gray-100">
                {upcomingInterviews.map((iv) => (
                  <li key={iv.id}>
                    <Link
                      href={`/dashboard/interviews/${iv.id}`}
                      className="group flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-gray-50"
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
