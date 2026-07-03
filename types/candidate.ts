// Pipeline = ONLY hiring lifecycle state. Interview scheduling/completion
// lives in the Interviews module and is never a pipeline state.
export type CandidateStage =
  | "applied"
  | "screening"
  | "shortlisted"
  | "interview"
  | "decision"
  | "hired"
  | "rejected";

export type AppliedVia = "manual" | "email" | "api";
export type AIRecommendation = "recommended" | "borderline" | "not_recommended";
export type AIStatus = "pending" | "processing" | "completed" | "failed";

export const AI_RECOMMENDATION_META: Record<AIRecommendation, { label: string; color: string }> = {
  recommended:     { label: "AI Recommended",     color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  borderline:      { label: "AI Borderline",      color: "text-amber-700 bg-amber-50 border-amber-200" },
  not_recommended: { label: "AI Not Recommended", color: "text-red-700 bg-red-50 border-red-200" },
};

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
  ai_strengths: string[] | null;
  ai_weaknesses: string[] | null;
  ai_summary: string | null;
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
  | "ai_strengths" | "ai_weaknesses" | "ai_summary"
> & {
  applied_via?: AppliedVia;
  ai_score?: number | null;
  ai_recommendation?: AIRecommendation | null;
  ai_reason?: string | null;
  ai_status?: AIStatus | null;
  ai_strengths?: string[] | null;
  ai_weaknesses?: string[] | null;
  ai_summary?: string | null;
};
export type CandidateUpdate = Partial<CandidateInsert>;

export interface CandidateFilters {
  query?: string;
  stage?: CandidateStage | "all";
  job_post_id?: string | "all";
  ai?: AIRecommendation | "all";
  page?: number;
}

export const STAGE_META: Record<
  CandidateStage,
  { label: string; color: string }
> = {
  applied:     { label: "Applied",     color: "bg-blue-50 text-blue-700 border-blue-100" },
  screening:   { label: "Screening",   color: "bg-yellow-50 text-yellow-700 border-yellow-100" },
  shortlisted: { label: "Shortlisted", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
  interview:   { label: "Interview",   color: "bg-purple-50 text-purple-700 border-purple-100" },
  decision:    { label: "Decision",    color: "bg-teal-50 text-teal-700 border-teal-100" },
  hired:       { label: "Hired",       color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  rejected:    { label: "Rejected",    color: "bg-red-50 text-red-500 border-red-100" },
};

export const STAGE_ORDER: CandidateStage[] = [
  "applied",
  "screening",
  "shortlisted",
  "interview",
  "decision",
  "hired",
  "rejected",
];

// ── Pipeline state machine ───────────────────────────────────────────────────
// Valid transitions. Rejected is reachable from any active stage.
export const STAGE_TRANSITIONS: Record<CandidateStage, CandidateStage[]> = {
  applied:     ["screening", "rejected"],
  screening:   ["shortlisted", "rejected"],
  shortlisted: ["interview", "rejected"],
  interview:   ["decision", "rejected"],
  decision:    ["hired", "rejected"],
  hired:       [],
  rejected:    [],
};

// Stages only an admin may move a candidate into (final authority)
export const ADMIN_ONLY_TARGET_STAGES: CandidateStage[] = ["hired", "rejected"];

export const ITEMS_PER_PAGE = 10;
