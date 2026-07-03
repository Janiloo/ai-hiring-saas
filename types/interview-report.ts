export type ReportRecommendation = "pass" | "fail" | "maybe";

export interface InterviewReport {
  id:              string;
  organization_id: string;
  interview_id:    string;
  candidate_id:    string;
  interviewer_id:  string;
  rating:          number; // 1–5
  notes:           string | null;
  recommendation:  ReportRecommendation;
  created_at:      string;
}

export const RECOMMENDATION_META: Record<ReportRecommendation, { label: string; color: string }> = {
  pass:  { label: "Pass",  color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  fail:  { label: "Fail",  color: "bg-red-50 text-red-600 border-red-200" },
  maybe: { label: "Maybe", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
};
