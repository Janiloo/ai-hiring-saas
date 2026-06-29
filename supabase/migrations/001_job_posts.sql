-- Job Posts table
create table if not exists job_posts (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  title            text        not null,
  department       text        not null,
  employment_type  text        not null check (employment_type in ('full-time','part-time','contract','internship')),
  location         text        not null,
  experience_required text     not null,
  salary_min       integer,
  salary_max       integer,
  description      text        not null,
  required_skills  text[]      not null default '{}',
  status           text        not null default 'active' check (status in ('active','paused','closed')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger job_posts_updated_at
  before update on job_posts
  for each row execute procedure update_updated_at();

-- Indexes
create index if not exists job_posts_user_id_idx  on job_posts(user_id);
create index if not exists job_posts_status_idx    on job_posts(status);
create index if not exists job_posts_created_at_idx on job_posts(created_at desc);

-- Row Level Security
alter table job_posts enable row level security;

create policy "Users manage their own job posts"
  on job_posts for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
