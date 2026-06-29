export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export const INVITATION_STATUS_META: Record<
  InvitationStatus,
  { label: string; color: string }
> = {
  pending:  { label: "Pending",  color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  accepted: { label: "Accepted", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  expired:  { label: "Expired",  color: "text-gray-500 bg-gray-50 border-gray-200" },
  revoked:  { label: "Revoked",  color: "text-red-600 bg-red-50 border-red-200" },
};

export interface Invitation {
  id:              string;
  email:           string;
  role:            string;
  organization_id: string;
  invited_by:      string;
  token:           string;
  status:          InvitationStatus;
  expires_at:      string;
  created_at:      string;
  accepted_at:     string | null;
}

/** Safe shape returned by the get_invitation_by_token DB function (no token field). */
export interface InvitationPublic {
  id:              string;
  email:           string;
  role:            string;
  organization_id: string;
  org_name:        string;
  status:          InvitationStatus;
  expires_at:      string;
}
