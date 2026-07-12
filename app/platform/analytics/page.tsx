import PageHeader from "@/components/PageHeader";
import SectionHeader from "@/components/SectionHeader";
import StatCard from "@/components/StatCard";
import Icon, { type IconName } from "@/components/ui/Icon";
import { getPlatformStats, getPlatformAiUsage } from "@/lib/platform/queries";

export const dynamic = "force-dynamic";

export default async function PlatformAnalyticsPage() {
  const [stats, ai] = await Promise.all([
    getPlatformStats(),
    getPlatformAiUsage(),
  ]);

  const platformCards: { label: string; value: number; icon: IconName; hint: string }[] = [
    { label: "Total Organizations", value: stats.total_organizations, icon: "building",     hint: `${stats.active_organizations} active · ${stats.suspended_organizations} suspended` },
    { label: "Total Users",         value: stats.total_users,         icon: "users",        hint: "Distinct members" },
    { label: "Total Candidates",    value: stats.total_candidates,    icon: "user-plus",    hint: "All tenants" },
    { label: "Total Job Posts",     value: stats.total_job_posts,     icon: "briefcase",    hint: "All tenants" },
    { label: "Total Recruiters",    value: stats.total_recruiters,    icon: "users",        hint: "Across orgs" },
    { label: "Total Interviewers",  value: stats.total_interviewers,  icon: "users",        hint: "Across orgs" },
    { label: "Total AI Evaluations",value: stats.total_ai_evaluations,icon: "sparkles",     hint: "Completed" },
    { label: "Total Emails Sent",   value: stats.total_emails_sent,   icon: "mail",         hint: "Delivered" },
  ];

  const aiCards: { label: string; value: number; icon: IconName; hint: string }[] = [
    { label: "Evaluations Performed",  value: ai.evaluations_performed,           icon: "sparkles",  hint: "Candidates scored by AI" },
    { label: "Resume Parsing",         value: ai.resume_parsing_count,            icon: "briefcase", hint: "Inbound resumes processed" },
    { label: "Recommendations",        value: ai.recommendation_generation_count, icon: "check-circle", hint: "AI recommendations generated" },
    { label: "Estimated AI Operations",value: ai.estimated_ai_operations,         icon: "activity",  hint: "Derived total (evals + parsing + recs)" },
  ];

  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title="Platform Analytics"
        subtitle="Live figures aggregated from real tenant data — no estimates unless labeled."
      />

      <section>
        <SectionHeader title="Platform Totals" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {platformCards.map((c) => (
            <StatCard key={c.label} {...c} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="AI Usage Monitoring" />
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-700">
          <Icon name="sparkles" size={15} className="mt-0.5 shrink-0" />
          <p>
            For future billing and monitoring. Counts reflect real operations recorded in the
            database. &ldquo;Estimated AI Operations&rdquo; is a derived sum of these counts, not a
            fabricated token or cost figure.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {aiCards.map((c) => (
            <StatCard key={c.label} {...c} />
          ))}
        </div>
      </section>
    </div>
  );
}
