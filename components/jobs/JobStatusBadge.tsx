import type { JobStatus, EmploymentType } from "@/types/job-post";
import { EMPLOYMENT_TYPE_LABELS } from "@/types/job-post";

const statusStyles: Record<JobStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-100",
  paused: "bg-yellow-50 text-yellow-700 border-yellow-100",
  closed: "bg-gray-100 text-gray-500 border-gray-200",
};

const statusLabels: Record<JobStatus, string> = {
  active: "Active",
  paused: "Paused",
  closed: "Closed",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

const typeStyles: Record<EmploymentType, string> = {
  "full-time": "bg-blue-50 text-blue-700 border-blue-100",
  "part-time": "bg-purple-50 text-purple-700 border-purple-100",
  "contract": "bg-orange-50 text-orange-700 border-orange-100",
  "internship": "bg-pink-50 text-pink-700 border-pink-100",
};

export function EmploymentTypeBadge({ type }: { type: EmploymentType }) {
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeStyles[type]}`}>
      {EMPLOYMENT_TYPE_LABELS[type]}
    </span>
  );
}
