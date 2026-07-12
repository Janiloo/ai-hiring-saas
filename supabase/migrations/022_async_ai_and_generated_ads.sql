-- ============================================================================
-- Migration 022: Async AI processing + persistent AI-generated job ads
--
-- Problem 1 (candidate sync speed) needs NO schema change — the ai_status
-- queue vocabulary (pending/processing/completed/failed) already exists from
-- migration 004. This migration only:
--   1. Adds persistent storage for AI-generated job advertisements.
--   2. Adds a helper index for the background AI queue processor.
-- ============================================================================

-- 1. Persistent AI-generated job posting content
alter table job_posts add column if not exists generated_ad    text;
alter table job_posts add column if not exists generated_ad_at timestamptz;

-- 2. Queue processing: claim pending/stuck candidates efficiently per org
create index if not exists candidates_ai_queue_idx
  on candidates(organization_id, ai_status)
  where ai_status in ('pending', 'processing');

notify pgrst, 'reload schema';
