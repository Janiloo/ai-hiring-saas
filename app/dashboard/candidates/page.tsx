import Link from "next/link";
import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import CandidateStageBadge from "@/components/candidates/CandidateStageBadge";
import AIStatusBadge from "@/components/candidates/AIStatusBadge";
import Icon from "@/components/ui/Icon";
import CandidateFilters from "@/components/candidates/CandidateFilters";
import DeleteCandidateButton from "@/components/candidates/DeleteCandidateButton";
import Pagination from "@/components/Pagination";
import { getCandidates } from "@/lib/queries/candidates";
import { getJobPosts } from "@/lib/queries/job-posts";
import { getUserOrganization } from "@/lib/queries/invitations";
import SyncInboxButton from "@/components/candidates/SyncInboxButton";
import AutoRefresh from "@/components/AutoRefresh";
import type { CandidateStage, AIRecommendation } from "@/types/candidate";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    stage?: string;
    job?: string;
    ai?: string;
    page?: string;
  }>;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function CandidatesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q ?? "";
  const stage = (params.stage ?? "all") as CandidateStage | "all";
  const job_post_id = params.job ?? "all";
  const ai = (params.ai ?? "all") as AIRecommendation | "all";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  const [{ data: candidates, count, totalPages }, { data: jobs }, orgResult] =
    await Promise.all([
      getCandidates({ query, stage, job_post_id, ai, page }),
      getJobPosts({ page: 1 }),
      getUserOrganization(),
    ]);

  const orgRole   = orgResult?.member.role ?? null;
  const canManage = orgRole === "admin" || orgRole === "recruiter";
  const jobOptions = jobs.map((j) => ({ id: j.id, title: j.title }));

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Keep the list fresh: new candidates from background ingestion and
          AI badge transitions appear without a manual reload. */}
      <AutoRefresh />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Candidates"
          subtitle="Browse and manage all applicants across your open roles."
        />
        {canManage && (
          <div className="flex shrink-0 items-center gap-3">
            <SyncInboxButton />
            <Link href="/dashboard/candidates/new" className="btn-primary">
              <Icon name="user-plus" size={16} />
              <span className="hidden sm:inline">Add Candidate</span>
            </Link>
          </div>
        )}
      </div>

      {/* Filters */}
      <Suspense>
        <CandidateFilters jobs={jobOptions} />
      </Suspense>

      {/* Count */}
      <p className="text-sm text-gray-500">
        {count === 0
          ? "No candidates found."
          : `${count} candidate${count !== 1 ? "s" : ""} found`}
      </p>

      {/* List */}
      {candidates.length === 0 ? (
        <div className="card flex flex-col items-center justify-center border-dashed py-16 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "var(--accent-subtle)", color: "var(--accent)", boxShadow: "inset 0 -2px 0 var(--edge)" }}>
            <Icon name="user-plus" size={20} />
          </span>
          <p className="mt-3 text-sm font-semibold text-gray-900">No candidates yet</p>
          <p className="mt-1 max-w-xs text-xs text-gray-500">
            Connect Gmail to ingest applications automatically, or add a candidate manually.
          </p>
          {canManage && (
            <Link href="/dashboard/candidates/new" className="btn-primary btn-sm mt-4">
              <Icon name="user-plus" size={14} />
              Add Candidate
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {candidates.map((c) => (
            <div
              key={c.id}
              className="card flex items-center justify-between gap-4 px-5 py-4 transition-shadow hover:shadow-md"
            >
              {/* Left: avatar + info */}
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                  {initials(c.full_name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {c.full_name}
                  </p>
                  <p className="truncate text-xs text-gray-500">{c.email}</p>
                  {c.job_post && (
                    <p className="truncate text-xs text-indigo-600">
                      {c.job_post.title}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: AI status + stage + date + actions */}
              <div className="flex shrink-0 items-center gap-4">
                <span className="hidden md:inline-flex">
                  <AIStatusBadge status={c.ai_status} />
                </span>
                <CandidateStageBadge stage={c.stage} />
                <p className="hidden text-xs text-gray-400 sm:block">
                  {new Date(c.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/dashboard/candidates/${c.id}`}
                    className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    View
                  </Link>
                  {canManage && (
                    <>
                      <Link
                        href={`/dashboard/candidates/${c.id}/edit`}
                        className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                      >
                        Edit
                      </Link>
                      <DeleteCandidateButton id={c.id} />
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Suspense>
        <Pagination page={page} totalPages={totalPages} />
      </Suspense>
    </div>
  );
}
