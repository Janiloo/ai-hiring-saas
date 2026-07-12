import Link from "next/link";
import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import { JobStatusBadge, EmploymentTypeBadge } from "@/components/jobs/JobStatusBadge";
import DeleteJobButton from "@/components/jobs/DeleteJobButton";
import Icon from "@/components/ui/Icon";
import JobFilters from "@/components/jobs/JobFilters";
import Pagination from "@/components/Pagination";
import { getJobPosts } from "@/lib/queries/job-posts";
import { getUserOrganization } from "@/lib/queries/invitations";
import type { JobStatus } from "@/types/job-post";
import { EXPERIENCE_OPTIONS } from "@/types/job-post";

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}

function formatSalary(min: number | null, max: number | null) {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

function experienceLabel(value: string) {
  return EXPERIENCE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export default async function JobPostsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q ?? "";
  const status = (params.status ?? "all") as JobStatus | "all";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  const [{ data: jobs, count, totalPages }, orgResult] = await Promise.all([
    getJobPosts({ query, status, page }),
    getUserOrganization(),
  ]);

  const orgRole   = orgResult?.member.role ?? null;
  const canManage = orgRole === "admin" || orgRole === "recruiter";

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Job Posts"
          subtitle="Manage open roles and track your hiring pipeline."
        />
        {canManage && (
          <Link href="/dashboard/jobs/new" className="btn-primary shrink-0">
            <Icon name="briefcase" size={16} />
            <span className="hidden sm:inline">New Job Post</span>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Suspense>
        <JobFilters />
      </Suspense>

      {/* Count */}
      <p className="text-sm text-gray-500">
        {count === 0 ? "No job posts found." : `${count} position${count !== 1 ? "s" : ""} found`}
      </p>

      {/* List */}
      {jobs.length === 0 ? (
        <div className="card flex flex-col items-center justify-center border-dashed py-16 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600" style={{ boxShadow: "inset 0 -2px 0 var(--edge)" }}>
            <Icon name="briefcase" size={20} />
          </span>
          <p className="mt-3 text-sm font-semibold text-gray-900">No job posts yet</p>
          <p className="mt-1 text-xs text-gray-500">Create your first role to get started.</p>
          {canManage && (
            <Link href="/dashboard/jobs/new" className="btn-primary btn-sm mt-4">
              <Icon name="briefcase" size={14} />
              New Job Post
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => {
            const salary = formatSalary(job.salary_min, job.salary_max);
            return (
              <div
                key={job.id}
                className="card flex items-center justify-between gap-4 px-5 py-4 transition-shadow hover:shadow-md"
              >
                {/* Left */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/jobs/${job.id}`}
                      className="text-sm font-semibold text-gray-900 hover:text-indigo-600"
                    >
                      {job.title}
                    </Link>
                    <EmploymentTypeBadge type={job.employment_type} />
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {job.department} · {job.location} · {experienceLabel(job.experience_required)}
                    {salary && ` · ${salary}`}
                  </p>
                  {job.required_skills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {job.required_skills.slice(0, 5).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.required_skills.length > 5 && (
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
                          +{job.required_skills.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right */}
                <div className="flex shrink-0 items-center gap-4">
                  <JobStatusBadge status={job.status} />
                  <p className="hidden text-xs text-gray-400 sm:block">
                    {new Date(job.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/dashboard/jobs/${job.id}`}
                      className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      View
                    </Link>
                    {canManage && (
                      <>
                        <Link
                          href={`/dashboard/jobs/${job.id}/edit`}
                          className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                          Edit
                        </Link>
                        <DeleteJobButton id={job.id} />
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <Suspense>
        <Pagination page={page} totalPages={totalPages} />
      </Suspense>
    </div>
  );
}
