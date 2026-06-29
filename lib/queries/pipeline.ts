import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { type CandidateWithJob, type CandidateStage, STAGE_ORDER } from "@/types/candidate";

export type PipelineGroups = Record<CandidateStage, CandidateWithJob[]>;

export async function getCandidatesGroupedByStage(): Promise<PipelineGroups> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("candidates")
    .select("*, job_post:job_posts(id, title)")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) throw new Error(error.message);

  const grouped = Object.fromEntries(
    STAGE_ORDER.map((s) => [s, [] as CandidateWithJob[]])
  ) as PipelineGroups;

  for (const c of (data ?? []) as CandidateWithJob[]) {
    grouped[c.stage].push(c);
  }

  return grouped;
}
