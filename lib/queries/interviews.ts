import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { type InterviewWithRelations, type InterviewFilters, ITEMS_PER_PAGE } from "@/types/interview";

export async function getInterviews(filters: InterviewFilters = {}) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { status = "all", page = 1 } = filters;
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  let query = supabase
    .from("interviews")
    .select("*, candidate:candidates(id, full_name, email), job_post:job_posts(id, title)", { count: "exact" })
    .order("scheduled_at", { ascending: true })
    .range(from, to);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    interviews: (data ?? []) as InterviewWithRelations[],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / ITEMS_PER_PAGE),
  };
}

export async function getInterviewById(id: string): Promise<InterviewWithRelations | null> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("interviews")
    .select("*, candidate:candidates(id, full_name, email), job_post:job_posts(id, title)")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as InterviewWithRelations;
}

export async function getUpcomingInterviews(limit = 5): Promise<InterviewWithRelations[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("interviews")
    .select("*, candidate:candidates(id, full_name, email), job_post:job_posts(id, title)")
    .eq("status", "scheduled")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as InterviewWithRelations[];
}
