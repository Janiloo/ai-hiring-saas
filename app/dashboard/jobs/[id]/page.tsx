import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { JobStatusBadge } from "@/components/jobs/JobStatusBadge";
import GeneratedAdPanel from "@/components/jobs/GeneratedAdPanel";
import { getJobPostById } from "@/lib/queries/job-posts";
import { getUserOrganization } from "@/lib/queries/invitations";
import { EMPLOYMENT_TYPE_LABELS, EXPERIENCE_OPTIONS } from "@/types/job-post";

interface PageProps {
  params: Promise<{ id: string }>;
}

function salaryLabel(min: number | null, max: number | null): string {
  if (min && max) return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
  if (min) return `From $${min.toLocaleString()}`;
  if (max) return `Up to $${max.toLocaleString()}`;
  return "Not disclosed";
}

export default async function JobPostDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [job, orgResult] = await Promise.all([
    getJobPostById(id),
    getUserOrganization(),
  ]);
  if (!job) notFound();

  const role = orgResult?.member.role ?? null;
  const canManage = role === "admin" || role === "recruiter";

  const facts = [
    { label: "Department",  value: job.department },
    { label: "Location",    value: job.location },
    { label: "Type",        value: EMPLOYMENT_TYPE_LABELS[job.employment_type] ?? job.employment_type },
    { label: "Experience",  value: EXPERIENCE_OPTIONS.find((o) => o.value === job.experience_required)?.label ?? job.experience_required },
    { label: "Salary",      value: salaryLabel(job.salary_min, job.salary_max) },
    { label: "Created",     value: new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
  ];

  return (
    <div className="flex flex-col gap-6 p-8">
      <Link
        href="/dashboard/jobs"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        <Icon name="arrow-right" size={14} className="rotate-180" />
        All job posts
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <JobStatusBadge status={job.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {job.department} · {job.location}
          </p>
        </div>
        {canManage && (
          <Link href={`/dashboard/jobs/${job.id}/edit`} className="btn-secondary">
            Edit job post
          </Link>
        )}
      </div>

      {/* Facts */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {facts.map((f) => (
          <div key={f.label} className="card card-pad">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{f.label}</p>
            <p className="mt-1 truncate text-sm font-semibold text-gray-900" title={f.value}>{f.value}</p>
          </div>
        ))}
      </div>

      {/* Description + skills */}
      <div className="card">
        <div className="border-b border-gray-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-gray-900">Job Description</h2>
        </div>
        <div className="px-5 py-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{job.description}</p>
          {job.required_skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {job.required_skills.map((skill) => (
                <span key={skill} className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Persisted AI advertisement: copy / edit / regenerate */}
      <GeneratedAdPanel
        jobId={job.id}
        ad={job.generated_ad}
        generatedAt={job.generated_ad_at}
        canManage={canManage}
      />
    </div>
  );
}
