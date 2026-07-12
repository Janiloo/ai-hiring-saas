export type JobStatus = "active" | "paused" | "closed";
export type EmploymentType = "full-time" | "part-time" | "contract" | "internship";

export interface JobPost {
  id: string;
  user_id: string;
  organization_id: string | null;
  title: string;
  department: string;
  employment_type: EmploymentType;
  location: string;
  experience_required: string;
  salary_min: number | null;
  salary_max: number | null;
  description: string;
  required_skills: string[];
  status: JobStatus;
  // AI-generated job advertisement (persisted — survives modal close)
  generated_ad: string | null;
  generated_ad_at: string | null;
  created_at: string;
  updated_at: string;
}

export type JobPostInsert = Omit<
  JobPost,
  "id" | "user_id" | "organization_id" | "generated_ad" | "generated_ad_at" | "created_at" | "updated_at"
>;
export type JobPostUpdate = Partial<JobPostInsert>;

export interface JobPostFilters {
  query?: string;
  status?: JobStatus | "all";
  page?: number;
}

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  "contract": "Contract",
  "internship": "Internship",
};

export const EXPERIENCE_OPTIONS = [
  { value: "entry", label: "Entry level (0–2 yrs)" },
  { value: "mid", label: "Mid level (2–5 yrs)" },
  { value: "senior", label: "Senior (5–8 yrs)" },
  { value: "lead", label: "Lead / Principal (8+ yrs)" },
];

export const ITEMS_PER_PAGE = 10;
