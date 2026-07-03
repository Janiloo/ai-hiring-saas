export type InterviewType =
  | "phone_screen"
  | "video_call"
  | "technical"
  | "onsite"
  | "panel"
  | "final_round";

export type InterviewStatus = "scheduled" | "completed" | "cancelled";

export interface Interview {
  id: string;
  user_id: string;
  organization_id: string | null;
  candidate_id: string;
  job_post_id: string | null;
  interviewer: string;               // denormalized display name
  interviewer_id: string | null;     // FK → auth.users (assigned interviewer)
  interview_type: InterviewType;
  scheduled_at: string;
  meeting_link: string | null;
  notes: string | null;
  status: InterviewStatus;
  created_at: string;
  updated_at: string;
}

export interface InterviewWithRelations extends Interview {
  candidate: { id: string; full_name: string; email: string } | null;
  job_post: { id: string; title: string } | null;
}

export type InterviewInsert = Omit<Interview, "id" | "user_id" | "organization_id" | "created_at" | "updated_at">;

export interface InterviewFilters {
  status?: InterviewStatus | "all";
  page?: number;
}

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  phone_screen: "Phone Screen",
  video_call:   "Video Call",
  technical:    "Technical",
  onsite:       "On-site",
  panel:        "Panel",
  final_round:  "Final Round",
};

export const INTERVIEW_TYPE_META: Record<InterviewType, string> = {
  phone_screen: "bg-gray-50 text-gray-700 border-gray-200",
  video_call:   "bg-blue-50 text-blue-700 border-blue-100",
  technical:    "bg-indigo-50 text-indigo-700 border-indigo-100",
  onsite:       "bg-orange-50 text-orange-700 border-orange-100",
  panel:        "bg-purple-50 text-purple-700 border-purple-100",
  final_round:  "bg-emerald-50 text-emerald-700 border-emerald-100",
};

export const INTERVIEW_STATUS_META: Record<InterviewStatus, { label: string; color: string }> = {
  scheduled:  { label: "Scheduled",  color: "bg-blue-50 text-blue-700 border-blue-100" },
  completed:  { label: "Completed",  color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  cancelled:  { label: "Cancelled",  color: "bg-red-50 text-red-500 border-red-100" },
};

export const ITEMS_PER_PAGE = 10;
