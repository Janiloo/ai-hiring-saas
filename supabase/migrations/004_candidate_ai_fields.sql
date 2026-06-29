-- Add intake source tracking
alter table candidates
  add column if not exists applied_via text not null default 'manual'
    check (applied_via in ('manual', 'email', 'api'));

-- Add AI evaluation fields (all nullable: null = AI not yet triggered)
alter table candidates
  add column if not exists ai_score          integer
    check (ai_score >= 0 and ai_score <= 100),
  add column if not exists ai_recommendation text
    check (ai_recommendation in ('reject', 'interview', 'review')),
  add column if not exists ai_reason         text,
  add column if not exists ai_status         text
    check (ai_status in ('pending', 'processing', 'completed', 'failed'));

-- Index for AI queue processing (find candidates awaiting evaluation)
create index if not exists candidates_ai_status_idx on candidates(ai_status)
  where ai_status is not null;

-- NOTE: Future enforcement — candidates should always belong to a job_post_id.
-- Once the UI enforces job selection at creation, run:
--   alter table candidates alter column job_post_id set not null;
-- Deferred to avoid breaking existing records.
