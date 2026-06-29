import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActivityLogType } from "@/types/activity-log";

interface LogParams {
  supabase: SupabaseClient;
  candidate_id: string;
  user_id: string;
  type: ActivityLogType;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Fire-and-forget activity log insert.
 * Never throws — a logging failure must never break the calling action.
 */
export async function logActivity({
  supabase,
  candidate_id,
  user_id,
  type,
  title,
  description = null,
  metadata = null,
}: LogParams): Promise<void> {
  try {
    await supabase.from("candidate_activity_logs").insert({
      candidate_id,
      user_id,
      type,
      title,
      description,
      metadata,
    });
  } catch {
    // Intentionally swallowed — logging is non-critical infrastructure
  }
}
