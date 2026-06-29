-- ============================================================
-- Candidate Activity Logs
-- Production event log for candidate lifecycle actions.
-- Append-only — no updates, no deletes via RLS.
-- ============================================================
create table if not exists candidate_activity_logs (
  id           uuid        primary key default gen_random_uuid(),
  candidate_id uuid        not null references candidates(id) on delete cascade,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  type         text        not null check (
                 type in ('APPLIED', 'STATUS_CHANGED', 'INTERVIEW_CREATED', 'NOTE_ADDED', 'JOB_ASSIGNED')
               ),
  title        text        not null,
  description  text,
  metadata     jsonb,
  created_at   timestamptz not null default now()
);

-- Indexes
create index if not exists cal_candidate_id_idx on candidate_activity_logs(candidate_id);
create index if not exists cal_created_at_idx   on candidate_activity_logs(candidate_id, created_at desc);

-- Row Level Security
alter table candidate_activity_logs enable row level security;

create policy "Users read their own activity logs"
  on candidate_activity_logs for select
  using (auth.uid() = user_id);

create policy "Users insert their own activity logs"
  on candidate_activity_logs for insert
  with check (auth.uid() = user_id);
