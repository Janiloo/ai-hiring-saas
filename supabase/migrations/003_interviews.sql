-- Interviews table
create table if not exists interviews (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users(id) on delete cascade,
  candidate_id   uuid        not null references candidates(id) on delete cascade,
  job_post_id    uuid        references job_posts(id) on delete set null,
  interviewer    text        not null,
  interview_type text        not null check (
    interview_type in ('phone_screen','video_call','technical','onsite','panel','final_round')
  ),
  scheduled_at   timestamptz not null,
  meeting_link   text,
  notes          text,
  status         text        not null default 'scheduled' check (
    status in ('scheduled','completed','cancelled')
  ),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger interviews_updated_at
  before update on interviews
  for each row execute procedure update_updated_at();

-- Indexes
create index if not exists interviews_user_id_idx      on interviews(user_id);
create index if not exists interviews_candidate_id_idx on interviews(candidate_id);
create index if not exists interviews_scheduled_at_idx on interviews(scheduled_at);
create index if not exists interviews_status_idx       on interviews(status);

-- Row Level Security
alter table interviews enable row level security;

create policy "Users manage their own interviews"
  on interviews for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
