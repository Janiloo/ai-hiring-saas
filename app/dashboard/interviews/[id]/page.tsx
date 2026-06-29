import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { InterviewStatusBadge, InterviewTypeBadge } from "@/components/interviews/InterviewStatusBadge";
import DeleteInterviewButton from "@/components/interviews/DeleteInterviewButton";
import CancelInterviewButton from "@/components/interviews/CancelInterviewButton";
import { getInterviewById } from "@/lib/queries/interviews";
import { getUserOrganization } from "@/lib/queries/invitations";

interface PageProps { params: Promise<{ id: string }> }

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function InterviewDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [interview, orgResult] = await Promise.all([
    getInterviewById(id),
    getUserOrganization(),
  ]);
  if (!interview) notFound();

  const orgRole   = orgResult?.member.role ?? null;
  const canManage = orgRole === "admin" || orgRole === "recruiter";

  return (
    <div className="flex flex-col gap-6 p-8 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/interviews"
            className="mb-2 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          >
            ← Back to Interviews
          </Link>
          <PageHeader title="Interview Details" />
        </div>
        {canManage && (
          <div className="flex items-center gap-2 pt-6">
            {interview.status === "scheduled" && (
              <>
                <Link
                  href={`/dashboard/interviews/${id}/edit`}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  Edit
                </Link>
                <CancelInterviewButton id={id} />
              </>
            )}
            <DeleteInterviewButton id={id} />
          </div>
        )}
      </div>

      {/* Main info card */}
      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        <div className="grid grid-cols-2 gap-0 divide-x divide-gray-100">
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Candidate</p>
            <p className="text-sm font-semibold text-gray-900">{interview.candidate?.full_name ?? "—"}</p>
            <p className="text-xs text-gray-500">{interview.candidate?.email ?? ""}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Job Post</p>
            <p className="text-sm text-gray-800">{interview.job_post?.title ?? "—"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-0 divide-x divide-gray-100">
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Interviewer</p>
            <p className="text-sm text-gray-800">{interview.interviewer}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Type</p>
            <InterviewTypeBadge type={interview.interview_type} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-0 divide-x divide-gray-100">
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Scheduled At</p>
            <p className="text-sm text-gray-800">{formatDateTime(interview.scheduled_at)}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Status</p>
            <InterviewStatusBadge status={interview.status} />
          </div>
        </div>

        {interview.meeting_link && (
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Meeting Link</p>
            <a
              href={interview.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:underline break-all"
            >
              {interview.meeting_link}
            </a>
          </div>
        )}

        {interview.notes && (
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{interview.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
