-- Candidates table
create table if not exists candidates (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  job_post_id  uuid        references job_posts(id) on delete set null,
  full_name    text        not null,
  email        text        not null,
  phone        text,
  resume_url   text,
  stage        text        not null default 'applied' check (
    stage in (
      'applied', 'screening', 'shortlisted',
      'interview_scheduled', 'interview_completed',
      'offer_sent', 'hired', 'rejected'
    )
  ),
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Reuse the update_updated_at function from migration 001
create trigger candidates_updated_at
  before update on candidates
  for each row execute procedure update_updated_at();

-- Indexes
create index if not exists candidates_user_id_idx     on candidates(user_id);
create index if not exists candidates_job_post_id_idx on candidates(job_post_id);
create index if not exists candidates_stage_idx       on candidates(stage);
create index if not exists candidates_created_at_idx  on candidates(created_at desc);

-- Row Level Security
alter table candidates enable row level security;

create policy "Users manage their own candidates"
  on candidates for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
