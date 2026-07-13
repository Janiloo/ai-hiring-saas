import { type InterviewStatus, type InterviewType, INTERVIEW_STATUS_META, INTERVIEW_TYPE_LABELS, INTERVIEW_TYPE_META } from "@/types/interview";

// Primary status → paint chip (matches pipeline/job status badges).
const statusChip: Record<InterviewStatus, string> = {
  scheduled: "chip-info",
  completed: "chip-success",
  cancelled: "chip-error",
};

export function InterviewStatusBadge({ status }: { status: InterviewStatus }) {
  const { label } = INTERVIEW_STATUS_META[status];
  return <span className={statusChip[status]}>{label}</span>;
}

export function InterviewTypeBadge({ type }: { type: InterviewType }) {
  const label = INTERVIEW_TYPE_LABELS[type];
  const color = INTERVIEW_TYPE_META[type];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
