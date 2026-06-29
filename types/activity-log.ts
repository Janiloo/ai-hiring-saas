export type ActivityLogType =
  | "APPLIED"
  | "STATUS_CHANGED"
  | "INTERVIEW_CREATED"
  | "NOTE_ADDED"
  | "JOB_ASSIGNED";

export interface ActivityLog {
  id: string;
  candidate_id: string;
  user_id: string;
  type: ActivityLogType;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export type ActivityLogInsert = Omit<ActivityLog, "id" | "created_at">;

export const ACTIVITY_TYPE_META: Record<
  ActivityLogType,
  { label: string; icon: string; color: string; dotColor: string }
> = {
  APPLIED:          { label: "Applied",             icon: "★", color: "text-emerald-600", dotColor: "bg-emerald-100 text-emerald-600" },
  STATUS_CHANGED:   { label: "Stage Changed",       icon: "⇅", color: "text-indigo-600",  dotColor: "bg-indigo-100 text-indigo-600"  },
  INTERVIEW_CREATED:{ label: "Interview Scheduled", icon: "🗓", color: "text-purple-600",  dotColor: "bg-purple-100 text-purple-600"  },
  NOTE_ADDED:       { label: "Note Added",          icon: "✎", color: "text-gray-600",    dotColor: "bg-gray-100 text-gray-500"      },
  JOB_ASSIGNED:     { label: "Job Assigned",        icon: "📋", color: "text-teal-600",   dotColor: "bg-teal-100 text-teal-600"      },
};
