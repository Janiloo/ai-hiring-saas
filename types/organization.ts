export type OrgRole = "admin" | "recruiter" | "interviewer";

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  admin:       "Admin",
  recruiter:   "Recruiter",
  interviewer: "Interviewer",
};

export const ORG_ROLE_META: Record<OrgRole, { label: string; color: string; description: string }> = {
  admin:       { label: "Admin",       color: "text-purple-700 bg-purple-50 border-purple-200", description: "Full access. Can invite and manage team members." },
  recruiter:   { label: "Recruiter",   color: "text-blue-700 bg-blue-50 border-blue-200",       description: "Can manage candidates, job posts, and interviews." },
  interviewer: { label: "Interviewer", color: "text-emerald-700 bg-emerald-50 border-emerald-200", description: "Can view assigned candidates and log interview notes." },
};

export interface Organization {
  id:         string;
  name:       string;
  created_by: string | null;
  created_at: string;
}

export interface OrgMember {
  id:              string;
  user_id:         string;
  organization_id: string;
  role:            OrgRole;
  created_at:      string;
}

export interface OrgMemberWithUser extends OrgMember {
  email?: string;
}
