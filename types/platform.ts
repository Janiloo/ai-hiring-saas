// Platform Administration (SUPER_ADMIN) types.
// These describe the shapes returned by the guarded SECURITY DEFINER RPCs in
// migration 020. SUPER_ADMIN is a platform-level tier, entirely separate from
// the org-level roles in types/organization.ts.

export type OrgStatus = "active" | "suspended";

export interface PlatformStats {
  total_organizations:     number;
  active_organizations:    number;
  suspended_organizations: number;
  total_users:             number;
  total_admins:            number;
  total_recruiters:        number;
  total_interviewers:      number;
  total_candidates:        number;
  total_job_posts:         number;
  total_interviews:        number;
  total_ai_evaluations:    number;
  total_emails_sent:       number;
}

export interface PlatformAiUsage {
  evaluations_performed:           number;
  resume_parsing_count:            number;
  recommendation_generation_count: number;
  estimated_ai_operations:         number;
}

export interface PlatformOrganization {
  id:              string;
  name:            string;
  status:          OrgStatus;
  created_at:      string;
  owner_email:     string | null;
  owner_name:      string | null;
  member_count:    number;
  candidate_count: number;
  job_post_count:  number;
}

export interface PlatformOrganizationDetail extends PlatformOrganization {
  interview_count: number;
}

export interface PlatformUser {
  user_id:           string;
  full_name:         string;
  email:             string;
  role:              string;
  organization_id:   string;
  organization_name: string;
  org_status:        OrgStatus;
  joined_at:         string;
  last_sign_in_at:   string | null;
}

export interface PlatformAuditLog {
  id:           string;
  actor_email:  string | null;
  action:       string;
  target_type:  string | null;
  target_id:    string | null;
  target_label: string | null;
  metadata:     Record<string, unknown>;
  created_at:   string;
}

export const AUDIT_ACTION_META: Record<string, { label: string; color: string }> = {
  org_suspended:    { label: "Organization suspended",   color: "text-red-700 bg-red-50 border-red-200" },
  org_reactivated:  { label: "Organization reactivated", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  org_created:      { label: "Organization created",     color: "text-blue-700 bg-blue-50 border-blue-200" },
  org_deleted:      { label: "Organization deleted",     color: "text-red-700 bg-red-50 border-red-200" },
  user_invited:     { label: "User invited",             color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  user_removed:     { label: "User removed",             color: "text-amber-700 bg-amber-50 border-amber-200" },
  settings_changed: { label: "Platform settings changed",color: "text-gray-700 bg-gray-50 border-gray-200" },
};

export const ORG_STATUS_META: Record<OrgStatus, { label: string; color: string; dot: string }> = {
  active:    { label: "Active",    color: "text-emerald-700 bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  suspended: { label: "Suspended", color: "text-red-700 bg-red-50 border-red-200",             dot: "bg-red-500" },
};
