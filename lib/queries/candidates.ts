import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import {
  type CandidateWithJob,
  type CandidateFilters,
  ITEMS_PER_PAGE,
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
  const { query, stage, job_post_id, page = 1 } = filters;
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
