import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { ActivityLog } from "@/types/activity-log";

export async function getCandidateActivityLogs(
  candidateId: string
): Promise<ActivityLog[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("candidate_activity_logs")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as ActivityLog[];
}
