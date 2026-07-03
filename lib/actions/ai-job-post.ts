"use server";

import { cookies } from "next/headers";
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

export async function generateJobAd(input: JobAdInput): Promise<JobAdResult> {
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
    return { ad: `${text}\n\n---\n\n${applicationInstructions(recruitmentEmail, input.title)}` };
  } catch (err) {
    console.error("[ai-job-post] Generation failed:", err);
    return { error: err instanceof Error ? err.message : "Failed to generate the job advertisement. Please try again." };
  }
}
