import type { AIRecommendation } from "@/types/candidate";
import {
  activeProvider,
  providerConfigError,
  generateJSON,
  extractPdfText,
} from "@/lib/utils/ai-provider";
import type { JobPost } from "@/types/job-post";

// ─────────────────────────────────────────────────────────────────────────────
// AI resume processing: parse the PDF resume into structured data and evaluate
// it against the matched job post.
//
// SYSTEM RULES:
//  - AI only parses and evaluates. It NEVER decides which job the candidate
//    applied for (the email subject determines that) and NEVER moves pipeline
//    stages.
// ─────────────────────────────────────────────────────────────────────────────

export interface ResumeEvaluation {
  full_name:      string;
  email:          string | null;
  phone:          string | null;
  skills:         string[];
  experience:     string;
  education:      string;
  certifications: string[];
  ai_score:          number;
  ai_recommendation: AIRecommendation;
  strengths:      string[];
  weaknesses:     string[];
  summary:        string;
  reasoning:      string;
}

const EVALUATION_SCHEMA = {
  type: "object",
  properties: {
    full_name:      { type: "string", description: "Candidate's full name from the resume" },
    email:          { type: ["string", "null"], description: "Candidate's email address, null if absent" },
    phone:          { type: ["string", "null"], description: "Candidate's phone number, null if absent" },
    skills:         { type: "array", items: { type: "string" } },
    experience:     { type: "string", description: "Concise summary of work experience" },
    education:      { type: "string", description: "Concise summary of education" },
    certifications: { type: "array", items: { type: "string" } },
    ai_score:       { type: "integer", description: "Fit score 0-100 against the job post" },
    ai_recommendation: {
      type: "string",
      enum: ["recommended", "borderline", "not_recommended"],
    },
    strengths:  { type: "array", items: { type: "string" } },
    weaknesses: { type: "array", items: { type: "string" } },
    summary:    { type: "string", description: "2-3 sentence candidate summary for recruiters" },
    reasoning:  { type: "string", description: "Why this score and recommendation" },
  },
  required: [
    "full_name", "email", "phone", "skills", "experience", "education",
    "certifications", "ai_score", "ai_recommendation", "strengths",
    "weaknesses", "summary", "reasoning",
  ],
  additionalProperties: false,
} as const;

export async function evaluateResume(
  pdfBase64: string,
  job: Pick<JobPost, "title" | "department" | "location" | "employment_type" | "experience_required" | "description" | "required_skills">
): Promise<ResumeEvaluation> {
  const configError = providerConfigError();
  if (configError) throw new Error(configError);

  const system =
    "You are a resume screening assistant for a recruitment platform. " +
    "Extract the candidate's information from the resume, then evaluate their fit against the given job post. " +
    "You only parse and evaluate — you never decide which job the candidate applied for and never make hiring decisions. " +
    "Scoring guide: 80-100 strong fit (recommended), 50-79 partial fit (borderline), below 50 poor fit (not_recommended). " +
    "Be honest about weaknesses; recruiters rely on this to prioritize their pipeline.";

  const jobBrief = `Job Title: ${job.title}
Department: ${job.department}
Location: ${job.location}
Employment Type: ${job.employment_type}
Experience Required: ${job.experience_required}
Required Skills: ${job.required_skills.join(", ")}

Job Description:
${job.description}`;

  let parsed: ResumeEvaluation;
  if (activeProvider() === "ollama") {
    // Local/cloud open models can't read PDFs — extract the text first
    const resumeText = await extractPdfText(pdfBase64);
    parsed = await generateJSON<ResumeEvaluation>(
      system,
      `Evaluate this resume against the following job post.

${jobBrief}

─── RESUME (extracted text) ───
${resumeText}`,
      EVALUATION_SCHEMA
    );
  } else {
    // Claude reads the PDF natively
    parsed = await generateJSON<ResumeEvaluation>(
      system,
      `Evaluate the attached resume against the following job post.

${jobBrief}`,
      EVALUATION_SCHEMA,
      pdfBase64
    );
  }

  // Clamp/normalize defensively — this feeds DB CHECK constraints
  parsed.ai_score = Math.max(0, Math.min(100, Math.round(parsed.ai_score)));
  if (!["recommended", "borderline", "not_recommended"].includes(parsed.ai_recommendation)) {
    parsed.ai_recommendation = "borderline";
  }
  return parsed;
}
