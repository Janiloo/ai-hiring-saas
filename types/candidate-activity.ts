export type ActivityActor = "user" | "ai" | "system" | "n8n";

export interface CandidateActivity {
  id: string;
  user_id: string;
  candidate_id: string;
  action: string;
  from_stage: string | null;
  to_stage: string | null;
  actor: ActivityActor;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export type CandidateActivityInsert = Omit<CandidateActivity, "id" | "created_at">;

export const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  stage_changed:  "Stage changed",
  email_sent:     "Email sent",
  ai_evaluated:   "AI evaluation completed",
  ai_queued:      "Queued for AI evaluation",
  draft_created:  "Email draft created",
  draft_approved: "Email draft approved",
  draft_rejected: "Email draft rejected",
  candidate_created: "Candidate created",
};
