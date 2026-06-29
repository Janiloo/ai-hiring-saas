export type CandidateStage =
  | "applied"
  | "screening"
  | "shortlisted"
  | "interview_scheduled"
  | "interview_completed"
  | "offer_sent"
  | "hired"
  | "rejected";

export type AppliedVia = "manual" | "email" | "api";
export type AIRecommendation = "reject" | "interview" | "review";
export type AIStatus = "pending" | "processing" | "completed" | "failed";

export interface Candidate {
  id: string;
  user_id: string;
  job_post_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  resume_url: string | null;
  stage: CandidateStage;
  notes: string | null;
  // Intake source
  applied_via: AppliedVia;
  // AI evaluation (null = not yet evaluated)
  ai_score: number | null;
  ai_recommendation: AIRecommendation | null;
  ai_reason: string | null;
  ai_status: AIStatus | null;
  created_at: string;
  updated_at: string;
}

export interface CandidateWithJob extends Candidate {
  job_post: { id: string; title: string; department: string } | null;
}

export type CandidateInsert = Omit<
  Candidate,
  | "id" | "user_id" | "created_at" | "updated_at"
  | "applied_via" | "ai_score" | "ai_recommendation" | "ai_reason" | "ai_status"
> & {
  applied_via?: AppliedVia;
  ai_score?: number | null;
  ai_recommendation?: AIRecommendation | null;
  ai_reason?: string | null;
  ai_status?: AIStatus | null;
};
export type CandidateUpdate = Partial<CandidateInsert>;

export interface CandidateFilters {
  query?: string;
  stage?: CandidateStage | "all";
  job_post_id?: string | "all";
  page?: number;
}

export const STAGE_META: Record<
  CandidateStage,
  { label: string; color: string }
> = {
  applied:              { label: "Applied",              color: "bg-blue-50 text-blue-700 border-blue-100" },
  screening:            { label: "Screening",            color: "bg-yellow-50 text-yellow-700 border-yellow-100" },
  shortlisted:          { label: "Shortlisted",          color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
  interview_scheduled:  { label: "Interview Scheduled",  color: "bg-purple-50 text-purple-700 border-purple-100" },
  interview_completed:  { label: "Interview Completed",  color: "bg-orange-50 text-orange-700 border-orange-100" },
  offer_sent:           { label: "Offer Sent",           color: "bg-teal-50 text-teal-700 border-teal-100" },
  hired:                { label: "Hired",                color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  rejected:             { label: "Rejected",             color: "bg-red-50 text-red-500 border-red-100" },
};

export const STAGE_ORDER: CandidateStage[] = [
  "applied",
  "screening",
  "shortlisted",
  "interview_scheduled",
  "interview_completed",
  "offer_sent",
  "hired",
  "rejected",
];

export const ITEMS_PER_PAGE = 10;
