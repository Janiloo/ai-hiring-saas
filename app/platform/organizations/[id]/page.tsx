import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/ui/Icon";
import OrgStatusControl from "@/components/platform/OrgStatusControl";
import { getPlatformOrganization } from "@/lib/platform/queries";
import { ORG_STATUS_META } from "@/types/platform";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function PlatformOrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await getPlatformOrganization(id);
  if (!org) notFound();

  const meta = ORG_STATUS_META[org.status];

  const metrics = [
    { label: "Members", value: org.member_count, icon: "users" as const },
    { label: "Candidates", value: org.candidate_count, icon: "user-plus" as const },
    { label: "Job Posts", value: org.job_post_count, icon: "briefcase" as const },
    { label: "Interviews", value: org.interview_count, icon: "calendar" as const },
  ];

  return (
    <div className="flex flex-col gap-6 p-8">
      <Link
        href="/platform/organizations"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        <Icon name="arrow-right" size={14} className="rotate-180" />
        All organizations
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-lg font-bold text-indigo-700">
            {org.name[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${meta.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">Created {formatDate(org.created_at)}</p>
          </div>
        </div>
      </div>

      {org.status === "suspended" && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <Icon name="ban" size={18} className="mt-0.5 shrink-0" />
          <p>
            This organization is <strong>suspended</strong>. Its members can still log in and view
            data, but all hiring operations (job posting, candidate management, interviews, Gmail
            sync, and AI evaluation) are disabled.
          </p>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="card card-pad">
            <div className="flex items-center gap-2 text-gray-400">
              <Icon name={m.icon} size={16} />
              <span className="text-xs font-medium uppercase tracking-wide">{m.label}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Owner */}
      <div className="card">
        <div className="border-b border-gray-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-gray-900">Organization Owner</h2>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm font-medium text-gray-900">{org.owner_name ?? "—"}</p>
          <p className="text-sm text-gray-500">{org.owner_email ?? "No owner on record"}</p>
        </div>
      </div>

      {/* Status management */}
      <div className="card">
        <div className="border-b border-gray-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-gray-900">Status Management</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Suspending disables hiring operations while keeping login and data access intact.
          </p>
        </div>
        <div className="px-5 py-4">
          <OrgStatusControl orgId={org.id} orgName={org.name} status={org.status} />
        </div>
      </div>
    </div>
  );
}
