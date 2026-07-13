import type { JobStatus, EmploymentType } from "@/types/job-post";
import { EMPLOYMENT_TYPE_LABELS } from "@/types/job-post";

// Primary status → paint chip (solid, matches the pipeline stage badges).
const statusChip: Record<JobStatus, string> = {
  active: "chip-success",
  paused: "chip-warning",
  closed: "chip-neutral",
};

const statusLabels: Record<JobStatus, string> = {
  active: "Active",
  paused: "Paused",
  closed: "Closed",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return <span className={statusChip[status]}>{statusLabels[status]}</span>;
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
