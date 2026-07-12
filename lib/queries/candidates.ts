import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import {
  type CandidateWithJob,
  type CandidateFilters,
  type MatchTier,
  ITEMS_PER_PAGE,
  STRONG_MATCH_MIN_SCORE,
} from "@/types/candidate";

export interface CandidatesResult {
  data: CandidateWithJob[];
  count: number;
  page: number;
  totalPages: number;
}

export async function getCandidates(
  filters: CandidateFilters = {}
): Promise<CandidatesResult> {
  const { query, stage, job_post_id, ai, page = 1 } = filters;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  let builder = supabase
    .from("candidates")
    .select("*, job_post:job_posts(id, title, department)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (query) {
    builder = builder.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);
  }

  if (stage && stage !== "all") {
    builder = builder.eq("stage", stage);
  }

  if (job_post_id && job_post_id !== "all") {
    builder = builder.eq("job_post_id", job_post_id);
  }

  if (ai && ai !== "all") {
    builder = builder.eq("ai_recommendation", ai);
  }

  const { data, count, error } = await builder;

  if (error) throw new Error(error.message);

  const total = count ?? 0;

  return {
    data: (data ?? []) as CandidateWithJob[],
    count: total,
    page,
    totalPages: Math.max(1, Math.ceil(total / ITEMS_PER_PAGE)),
  };
}

export interface AiRecommendationFilters {
  tier?: MatchTier | "all";
  job_post_id?: string | "all";
  minScore?: number;
  /** Free-text match against AI summary / reasoning / parsed notes (skills, experience). */
  query?: string;
}

/**
 * Candidates ranked by AI evaluation, for the AI Recommendations page.
 * Only completed evaluations appear. Read-only ranking — moving pipeline
 * stages still happens exclusively through the normal pipeline controls.
 */
export async function getAiRecommendedCandidates(
  filters: AiRecommendationFilters = {}
): Promise<CandidateWithJob[]> {
  const { tier = "all", job_post_id = "all", minScore, query } = filters;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let builder = supabase
    .from("candidates")
    .select("*, job_post:job_posts(id, title, department)")
    .eq("ai_status", "completed")
    .not("ai_score", "is", null)
    .order("ai_score", { ascending: false })
    .limit(200);

  // Tier → stored fields (Strong Match is derived: recommended + score ≥ 80)
  if (tier === "strong_match") {
    builder = builder.eq("ai_recommendation", "recommended").gte("ai_score", STRONG_MATCH_MIN_SCORE);
  } else if (tier === "recommended") {
    builder = builder.eq("ai_recommendation", "recommended").lt("ai_score", STRONG_MATCH_MIN_SCORE);
  } else if (tier === "needs_review") {
    builder = builder.eq("ai_recommendation", "borderline");
  } else if (tier === "not_recommended") {
    builder = builder.eq("ai_recommendation", "not_recommended");
  }

  if (job_post_id && job_post_id !== "all") {
    builder = builder.eq("job_post_id", job_post_id);
  }
  if (typeof minScore === "number" && !Number.isNaN(minScore)) {
    builder = builder.gte("ai_score", minScore);
  }
  if (query) {
    const q = query.replaceAll(",", " ").trim();
    if (q) {
      // Skills/experience live in ai_summary, ai_reason, and parsed notes
      builder = builder.or(
        `full_name.ilike.%${q}%,ai_summary.ilike.%${q}%,ai_reason.ilike.%${q}%,notes.ilike.%${q}%`
      );
    }
  }

  const { data, error } = await builder;
  if (error) throw new Error(error.message);
  return (data ?? []) as CandidateWithJob[];
}

export async function getAllCandidates(): Promise<{ id: string; full_name: string; email: string }[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("candidates")
    .select("id, full_name, email")
    .order("full_name", { ascending: true })
    .limit(500);

  if (error) return [];
  return (data ?? []) as { id: string; full_name: string; email: string }[];
}

export async function getCandidateById(
  id: string
): Promise<CandidateWithJob | null> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("candidates")
    .select("*, job_post:job_posts(id, title, department)")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as CandidateWithJob;
}
