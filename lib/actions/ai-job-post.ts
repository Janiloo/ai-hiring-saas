"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getUserOrgMembership } from "@/lib/utils/get-user-org";
import { generateText, providerConfigError } from "@/lib/utils/ai-provider";

export interface JobAdInput {
  title:               string;
  department:          string;
  location:            string;
  employment_type:     string;
  experience_required: string;
  salary_min:          number | null;
  salary_max:          number | null;
  description:         string;
  required_skills:     string[];
}

export interface JobAdResult {
  ad?:    string;
  error?: string;
}

/**
 * Builds the mandatory "How to Apply" section. This is appended in code —
 * the AI is never allowed to write or modify these instructions, because the
 * automated ingestion system depends on the exact subject-line format.
 */
function applicationInstructions(recruitmentEmail: string, jobTitle: string): string {
  return `How to Apply

Send your application to:

${recruitmentEmail}

Subject:

${jobTitle} Candidate

Attach the following:

• Resume (PDF)

Important:

Your email subject must exactly match the format above. Applications with incorrect subject lines will not be processed by our automated recruitment system.

Examples:

Automation Engineer Candidate

Senior Frontend Engineer Candidate

Accountant Candidate`;
}

/**
 * Generates the job advertisement and — when jobPostId is provided — persists
 * it to job_posts.generated_ad so it survives closing the modal. RLS scopes
 * the update to the caller's org.
 */
export async function generateJobAd(
  input: JobAdInput,
  jobPostId?: string
): Promise<JobAdResult> {
  const cookieStore = await cookies();
  const supabase    = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const membership = await getUserOrgMembership(supabase);
  if (!membership) return { error: "You must belong to an organization." };
  if (membership.orgRole === "interviewer") return { error: "Interviewers cannot generate job posts." };

  // Recruitment email comes from org settings — configurable per organization
  const { data: org } = await supabase
    .from("organizations")
    .select("name, recruitment_email")
    .eq("id", membership.orgId)
    .maybeSingle();

  const recruitmentEmail = org?.recruitment_email?.trim();
  if (!recruitmentEmail) {
    return { error: "No Recruitment Email configured. An admin can set it in Settings → Recruitment." };
  }

  const configError = providerConfigError();
  if (configError) return { error: configError };

  const salary =
    input.salary_min && input.salary_max
      ? `$${input.salary_min.toLocaleString()} – $${input.salary_max.toLocaleString()}`
      : input.salary_min
      ? `From $${input.salary_min.toLocaleString()}`
      : input.salary_max
      ? `Up to $${input.salary_max.toLocaleString()}`
      : null;

  const system =
    "You write professional job advertisements for recruitment platforms (LinkedIn, Indeed, JobStreet, Facebook Jobs, company career pages). " +
    "Rewrite the provided job details into a natural, engaging, professional hiring post — do NOT simply concatenate the fields. " +
    "Structure: a compelling opening about the role and company, responsibilities, requirements/qualifications, and what's offered. " +
    "Plain text only (no markdown syntax like ** or ##) so it pastes cleanly anywhere. " +
    "Output ONLY the advertisement text itself — no preamble, no commentary. " +
    "Do NOT include any application instructions, contact email, or 'how to apply' section — the system appends those separately and they must not be duplicated.";

  const prompt = `Company: ${org?.name ?? "our company"}
Job Title: ${input.title}
Department: ${input.department}
Location: ${input.location}
Employment Type: ${input.employment_type}
Experience Required: ${input.experience_required}
${salary ? `Salary Range: ${salary}` : "Salary: not disclosed"}
Required Skills: ${input.required_skills.join(", ") || "—"}

Job Description (raw notes from the recruiter):
${input.description}`;

  try {
    const text = await generateText(system, prompt);

    // Mandatory application instructions — appended verbatim, never AI-written
    const ad = `${text}\n\n---\n\n${applicationInstructions(recruitmentEmail, input.title)}`;

    // Persist so the generated content is never lost when the modal closes.
    // RLS restricts the update to admins/recruiters of the owning org.
    if (jobPostId) {
      const { error: saveError } = await supabase
        .from("job_posts")
        .update({ generated_ad: ad, generated_ad_at: new Date().toISOString() })
        .eq("id", jobPostId);
      if (saveError) console.error("[ai-job-post] Failed to persist generated ad:", saveError.message);
      revalidatePath(`/dashboard/jobs/${jobPostId}`);
      revalidatePath(`/dashboard/jobs/${jobPostId}/edit`);
    }

    return { ad };
  } catch (err) {
    console.error("[ai-job-post] Generation failed:", err);
    return { error: err instanceof Error ? err.message : "Failed to generate the job advertisement. Please try again." };
  }
}

/**
 * Regenerates the advertisement for an existing job post using its CURRENT
 * fields in the database (used by the detail/edit pages after fields change).
 * The UI asks for confirmation before calling this — it replaces the stored ad.
 */
export async function regenerateJobAd(jobPostId: string): Promise<JobAdResult> {
  const cookieStore = await cookies();
  const supabase    = createClient(cookieStore);

  // RLS: only rows in the caller's org are visible
  const { data: job } = await supabase
    .from("job_posts")
    .select("title, department, location, employment_type, experience_required, salary_min, salary_max, description, required_skills")
    .eq("id", jobPostId)
    .maybeSingle();

  if (!job) return { error: "Job post not found." };

  return generateJobAd(job as JobAdInput, jobPostId);
}

/** Saves a manually edited version of the generated advertisement. */
export async function saveGeneratedAd(
  jobPostId: string,
  content: string
): Promise<{ error?: string }> {
  const cookieStore = await cookies();
  const supabase    = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const membership = await getUserOrgMembership(supabase);
  if (!membership) return { error: "You must belong to an organization." };
  if (membership.orgRole === "interviewer") return { error: "Interviewers cannot edit job posts." };

  const trimmed = content.trim();
  if (!trimmed) return { error: "The job posting content cannot be empty." };

  const { error } = await supabase
    .from("job_posts")
    .update({ generated_ad: trimmed, generated_ad_at: new Date().toISOString() })
    .eq("id", jobPostId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/jobs/${jobPostId}`);
  revalidatePath(`/dashboard/jobs/${jobPostId}/edit`);
  return {};
}
