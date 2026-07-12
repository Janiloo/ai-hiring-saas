import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import SectionHeader from "@/components/SectionHeader";
import StatCard from "@/components/StatCard";
import Icon, { type IconName } from "@/components/ui/Icon";
import { getPlatformStats, getPlatformOrganizations } from "@/lib/platform/queries";
import { ORG_STATUS_META } from "@/types/platform";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function PlatformDashboardPage() {
  const [stats, orgs] = await Promise.all([
    getPlatformStats(),
    getPlatformOrganizations(),
  ]);

  const recentOrgs = orgs.slice(0, 6);

  const cards: { label: string; value: number; icon: IconName; hint: string }[] = [
    { label: "Organizations", value: stats.total_organizations, icon: "building",     hint: `${stats.active_organizations} active · ${stats.suspended_organizations} suspended` },
    { label: "Total Users",   value: stats.total_users,         icon: "users",        hint: `${stats.total_recruiters} recruiters · ${stats.total_interviewers} interviewers` },
    { label: "Candidates",    value: stats.total_candidates,    icon: "user-plus",    hint: "Across all tenants" },
    { label: "Job Posts",     value: stats.total_job_posts,     icon: "briefcase",    hint: "Across all tenants" },
    { label: "AI Evaluations",value: stats.total_ai_evaluations,icon: "sparkles",     hint: "Completed" },
    { label: "Emails Sent",   value: stats.total_emails_sent,   icon: "mail",         hint: "Delivered" },
  ];

  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title="Platform Overview"
        subtitle="Cross-tenant metrics for the entire HyperFlow platform."
      />

      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => (
            <StatCard key={c.label} {...c} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Recent Organizations"
          action={
            <Link href="/platform/organizations" className="btn-secondary btn-sm">
              View all
              <Icon name="arrow-right" size={14} />
            </Link>
          }
        />
        {recentOrgs.length === 0 ? (
          <div className="card flex flex-col items-center justify-center border-dashed py-10 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <Icon name="building" size={20} />
            </span>
            <p className="mt-3 text-sm text-gray-500">No organizations yet.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {recentOrgs.map((o) => {
                const meta = ORG_STATUS_META[o.status];
                return (
                  <li key={o.id}>
                    <Link
                      href={`/platform/organizations/${o.id}`}
                      className="group flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-gray-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-700">
                          {o.name[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">{o.name}</p>
                          <p className="truncate text-xs text-gray-500">
                            {o.owner_email ?? "No owner"} · {o.member_count} member{o.member_count !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="hidden text-xs text-gray-400 sm:inline">{formatDate(o.created_at)}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${meta.color}`}>
                          {meta.label}
                        </span>
                        <Icon name="chevron-right" size={16} className="text-gray-300 transition group-hover:text-gray-400" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
