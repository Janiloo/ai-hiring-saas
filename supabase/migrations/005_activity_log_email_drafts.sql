-- ============================================================
-- Candidate Activity Log
-- Immutable append-only record of stage changes and key actions.
-- Written by: server actions, n8n webhooks (via service role).
-- ============================================================
create table if not exists candidate_activity_log (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  candidate_id uuid        not null references candidates(id) on delete cascade,
  action       text        not null,         -- e.g. 'stage_changed', 'email_sent', 'ai_evaluated'
  from_stage   text,                         -- previous stage (nullable for non-stage events)
  to_stage     text,                         -- new stage (nullable for non-stage events)
  actor        text        not null default 'user',  -- 'user' | 'ai' | 'system' | 'n8n'
  metadata     jsonb,                        -- flexible payload (AI score, email id, etc.)
  created_at   timestamptz not null default now()
);

-- No updates — log entries are immutable
create index if not exists activity_log_candidate_id_idx on candidate_activity_log(candidate_id);
create index if not exists activity_log_user_id_idx      on candidate_activity_log(user_id);
create index if not exists activity_log_created_at_idx   on candidate_activity_log(created_at desc);

alter table candidate_activity_log enable row level security;

create policy "Users view their own activity logs"
  on candidate_activity_log for select
  using (auth.uid() = user_id);

create policy "Users insert their own activity logs"
  on candidate_activity_log for insert
  with check (auth.uid() = user_id);


-- ============================================================
-- Email Drafts
-- n8n generates drafts; HR approves before any email is sent.
-- ============================================================
create table if not exists email_drafts (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  candidate_id     uuid        not null references candidates(id) on delete cascade,
  email_type       text        not null
    check (email_type in ('rejection', 'interview_invite', 'offer', 'general')),
  subject          text        not null,
  body             text        not null,
  approval_status  text        not null default 'pending'
    check (approval_status in ('pending', 'approved', 'rejected', 'sent')),
  approved_by      uuid        references auth.users(id) on delete set null,
  approved_at      timestamptz,
  sent_at          timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger email_drafts_updated_at
  before update on email_drafts
  for each row execute procedure update_updated_at();

create index if not exists email_drafts_candidate_id_idx     on email_drafts(candidate_id);
create index if not exists email_drafts_user_id_idx          on email_drafts(user_id);
create index if not exists email_drafts_approval_status_idx  on email_drafts(approval_status);

alter table email_drafts enable row level security;

create policy "Users manage their own email drafts"
  on email_drafts for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
