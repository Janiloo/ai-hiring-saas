import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { type CandidateWithJob } from "@/types/candidate";
import { type InterviewWithRelations } from "@/types/interview";
import { STAGE_ORDER } from "@/types/candidate";

export interface DashboardStats {
  totalCandidates: number;
  openJobs: number;
  interviewsToday: number;
  hiredThisMonth: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentCandidates: CandidateWithJob[];
  upcomingInterviews: InterviewWithRelations[];
  stageCounts: Record<string, number>;
}

export async function getDashboardData(): Promise<DashboardData> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { count: totalCandidates },
    { count: openJobs },
    { count: interviewsToday },
    { count: hiredThisMonth },
    { data: recentCandidatesRaw },
    { data: upcomingInterviewsRaw },
    { data: stageCandidates },
  ] = await Promise.all([
    supabase.from("candidates").select("*", { count: "exact", head: true }),
    supabase.from("job_posts").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("interviews")
      .select("*", { count: "exact", head: true })
      .eq("status", "scheduled")
      .gte("scheduled_at", todayStart)
      .lt("scheduled_at", todayEnd),
    supabase
      .from("candidates")
      .select("*", { count: "exact", head: true })
      .eq("stage", "hired")
      .gte("updated_at", monthStart),
    supabase
      .from("candidates")
      .select("*, job_post:job_posts(id, title, department)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("interviews")
      .select("*, candidate:candidates(id, full_name, email), job_post:job_posts(id, title)")
      .eq("status", "scheduled")
      .gte("scheduled_at", now.toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(5),
    supabase
      .from("candidates")
      .select("stage"),
  ]);

  // Build stage count map
  const stageCounts: Record<string, number> = Object.fromEntries(
    STAGE_ORDER.map((s) => [s, 0])
  );
  for (const row of (stageCandidates ?? [])) {
    if (row.stage in stageCounts) stageCounts[row.stage]++;
  }

  return {
    stats: {
      totalCandidates: totalCandidates ?? 0,
      openJobs:        openJobs ?? 0,
      interviewsToday: interviewsToday ?? 0,
      hiredThisMonth:  hiredThisMonth ?? 0,
    },
    recentCandidates:   (recentCandidatesRaw ?? []) as CandidateWithJob[],
    upcomingInterviews: (upcomingInterviewsRaw ?? []) as InterviewWithRelations[],
    stageCounts,
  };
}
