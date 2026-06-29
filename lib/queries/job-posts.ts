import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { type JobPost, type JobPostFilters, ITEMS_PER_PAGE } from "@/types/job-post";

export interface JobPostsResult {
  data: JobPost[];
  count: number;
  page: number;
  totalPages: number;
}

export async function getJobPosts(filters: JobPostFilters = {}): Promise<JobPostsResult> {
  const { query, status, page = 1 } = filters;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  let builder = supabase
    .from("job_posts")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (query) {
    builder = builder.ilike("title", `%${query}%`);
  }

  if (status && status !== "all") {
    builder = builder.eq("status", status);
  }

  const { data, count, error } = await builder;

  if (error) throw new Error(error.message);

  const total = count ?? 0;

  return {
    data: (data ?? []) as JobPost[],
    count: total,
    page,
    totalPages: Math.max(1, Math.ceil(total / ITEMS_PER_PAGE)),
  };
}

export async function getAllJobPosts(): Promise<{ id: string; title: string }[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("job_posts")
    .select("id, title")
    .eq("status", "active")
    .order("title", { ascending: true })
    .limit(200);

  if (error) return [];
  return (data ?? []) as { id: string; title: string }[];
}

export async function getJobPostById(id: string): Promise<JobPost | null> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("job_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as JobPost;
}
