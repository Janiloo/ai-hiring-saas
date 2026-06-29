-- Add job_post_id to email_drafts.
-- The table was created in migration 005 without this FK.
alter table email_drafts
  add column if not exists job_post_id uuid references job_posts(id) on delete set null;

create index if not exists email_drafts_job_post_id_idx on email_drafts(job_post_id);

-- Field name mapping vs. original spec:
--   spec "type"       → email_type       (rejection | interview_invite | offer | general)
--   spec "status"     → approval_status  (pending | approved | rejected | sent)
--   spec "created_by" → user_id
-- These are equivalent — existing constraints are intentionally preserved.
