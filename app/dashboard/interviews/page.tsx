import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import { InterviewStatusBadge, InterviewTypeBadge } from "@/components/interviews/InterviewStatusBadge";
import Icon from "@/components/ui/Icon";
import { getInterviews } from "@/lib/queries/interviews";
import { getUserOrganization } from "@/lib/queries/invitations";
import { type InterviewStatus } from "@/types/interview";

const STATUS_TABS: { label: string; value: InterviewStatus | "all" }[] = [
  { label: "All",       value: "all" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function InterviewsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = (params.status as InterviewStatus | "all") ?? "all";
  const page = Number(params.page ?? 1);

  const [{ interviews, total, totalPages }, orgResult] = await Promise.all([
    getInterviews({ status, page }),
    getUserOrganization(),
  ]);

  const orgRole   = orgResult?.member.role ?? null;
  const canManage = orgRole === "admin" || orgRole === "recruiter";

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Interviews"
          subtitle={`${total} interview${total !== 1 ? "s" : ""} total`}
        />
        {canManage && (
          <Link href="/dashboard/interviews/new" className="btn-primary shrink-0">
            <Icon name="calendar-plus" size={16} />
            <span className="hidden sm:inline">Schedule Interview</span>
          </Link>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {STATUS_TABS.map((tab) => {
          const active = status === tab.value;
          return (
            <Link
              key={tab.value}
              href={`/dashboard/interviews?status=${tab.value}`}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
                active
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {interviews.length === 0 ? (
        <div className="card flex flex-col items-center justify-center border-dashed py-16 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600" style={{ boxShadow: "inset 0 -2px 0 var(--edge)" }}>
            <Icon name="calendar-plus" size={20} />
          </span>
          <p className="mt-3 text-sm font-semibold text-gray-900">No interviews found</p>
          {canManage && (
            <Link href="/dashboard/interviews/new" className="btn-primary btn-sm mt-4">
              <Icon name="calendar-plus" size={14} />
              Schedule your first interview
            </Link>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">Candidate</th>
                <th className="px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 font-medium text-gray-600">Interviewer</th>
                <th className="px-4 py-3 font-medium text-gray-600">Scheduled At</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Job</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {interviews.map((iv) => (
                <tr key={iv.id} className="transition hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{iv.candidate?.full_name ?? "—"}</div>
                    <div className="text-xs text-gray-500">{iv.candidate?.email ?? ""}</div>
                  </td>
                  <td className="px-4 py-3">
                    <InterviewTypeBadge type={iv.interview_type} />
                  </td>
                  <td className="px-4 py-3 text-gray-700">{iv.interviewer}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                    {formatDateTime(iv.scheduled_at)}
                  </td>
                  <td className="px-4 py-3">
                    <InterviewStatusBadge status={iv.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{iv.job_post?.title ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/interviews/${iv.id}`}
                      className="text-xs font-medium text-indigo-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} />}
    </div>
  );
}
