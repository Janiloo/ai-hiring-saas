import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { InterviewStatusBadge, InterviewTypeBadge } from "@/components/interviews/InterviewStatusBadge";
import DeleteInterviewButton from "@/components/interviews/DeleteInterviewButton";
import CancelInterviewButton from "@/components/interviews/CancelInterviewButton";
import { getInterviewById, getInterviewReports } from "@/lib/queries/interviews";
import { getUserOrganization } from "@/lib/queries/invitations";
import InterviewReportForm from "@/components/interviews/InterviewReportForm";
import { RECOMMENDATION_META, type InterviewReport, type ReportRecommendation } from "@/types/interview-report";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

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
  const cookieStore = await cookies();
  const supabase    = createClient(cookieStore);

  const [interview, orgResult, reports, { data: { user } }] = await Promise.all([
    getInterviewById(id),
    getUserOrganization(),
    getInterviewReports(id),
    supabase.auth.getUser(),
  ]);
  if (!interview) notFound();

  const orgRole   = orgResult?.member.role ?? null;
  const canManage = orgRole === "admin" || orgRole === "recruiter";

  const isAssignedInterviewer = user?.id != null && interview.interviewer_id === user.id;
  const alreadyReported       = reports.some((r: InterviewReport) => r.interviewer_id === user?.id);
  const showReportForm =
    isAssignedInterviewer && !alreadyReported && interview.status !== "cancelled";

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

      {/* ── Interview report form — assigned interviewer only ─────────────── */}
      {showReportForm && <InterviewReportForm interviewId={id} />}

      {/* ── Submitted reports — evaluation data, visible to org members ───── */}
      {reports.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-gray-900">Interview Reports</h2>
            <p className="mt-0.5 text-xs text-gray-400">
              Evaluation feedback — pipeline decisions are made separately by recruiters and admins.
            </p>
          </div>
          <ul className="divide-y divide-gray-100">
            {(reports as InterviewReport[]).map((report) => {
              const rec = RECOMMENDATION_META[report.recommendation as ReportRecommendation];
              return (
                <li key={report.id} className="flex flex-col gap-2 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-yellow-400">
                        {"★".repeat(report.rating)}
                        <span className="text-gray-200">{"★".repeat(5 - report.rating)}</span>
                      </span>
                      <span className="text-xs text-gray-400">{report.rating}/5</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${rec?.color ?? ""}`}>
                        {rec?.label ?? report.recommendation}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(report.created_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  {report.notes && (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.notes}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
