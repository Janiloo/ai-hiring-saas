export type EmailDraftType = "rejection" | "interview_invite" | "offer" | "general";
export type EmailDraftApprovalStatus = "pending" | "approved" | "rejected" | "sent";

export interface EmailDraft {
  id: string;
  user_id: string;
  candidate_id: string;
  job_post_id: string | null;
  email_type: EmailDraftType;
  subject: string;
  body: string;
  approval_status: EmailDraftApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export type EmailDraftInsert = Omit<EmailDraft, "id" | "user_id" | "approved_by" | "approved_at" | "sent_at" | "created_at" | "updated_at">;

export const EMAIL_DRAFT_TYPE_LABELS: Record<EmailDraftType, string> = {
  rejection:        "Rejection",
  interview_invite: "Interview Invitation",
  offer:            "Offer Letter",
  general:          "General",
};

export const EMAIL_DRAFT_STATUS_META: Record<EmailDraftApprovalStatus, { label: string; color: string }> = {
  pending:  { label: "Pending Review", color: "bg-yellow-50 text-yellow-700 border-yellow-100" },
  approved: { label: "Approved",       color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  rejected: { label: "Rejected",       color: "bg-red-50 text-red-500 border-red-100" },
  sent:     { label: "Sent",           color: "bg-blue-50 text-blue-700 border-blue-100" },
};
