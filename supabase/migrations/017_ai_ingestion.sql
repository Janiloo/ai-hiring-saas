-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 017: AI job post generator + email ingestion + AI resume evaluation
--
--  1. Org recruitment settings (recruitment email + Gmail OAuth token)
--  2. Candidate AI evaluation fields (score / recommendation / strengths / …)
--  3. Ingestion logs (every inbox processing attempt, success or failure)
-- ═══════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ORGANIZATION RECRUITMENT SETTINGS
-- ─────────────────────────────────────────────────────────────────────────────

alter table organizations add column if not exists recruitment_email     text;
alter table organizations add column if not exists gmail_refresh_token   text;
alter table organizations add column if not exists gmail_connected_email text;

-- Only admins may change org settings
drop policy if exists "Admins can update organization" on organizations;
create policy "Admins can update organization"
  on organizations for update
  using (get_user_org_role(id, auth.uid()) = 'admin');


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CANDIDATE AI EVALUATION FIELDS
--    Recommendation values move to: recommended / borderline / not_recommended
-- ─────────────────────────────────────────────────────────────────────────────

alter table candidates drop constraint if exists candidates_ai_recommendation_check;

-- Map legacy values onto the new vocabulary
update candidates set ai_recommendation = 'recommended'     where ai_recommendation = 'interview';
update candidates set ai_recommendation = 'borderline'      where ai_recommendation = 'review';
update candidates set ai_recommendation = 'not_recommended' where ai_recommendation = 'reject';

alter table candidates add constraint candidates_ai_recommendation_check
  check (ai_recommendation in ('recommended', 'borderline', 'not_recommended'));

alter table candidates add column if not exists ai_strengths  text[];
alter table candidates add column if not exists ai_weaknesses text[];
alter table candidates add column if not exists ai_summary    text;

create index if not exists candidates_ai_recommendation_idx
  on candidates(ai_recommendation) where ai_recommendation is not null;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. INGESTION LOGS — audit trail for every processed inbox message
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists ingestion_logs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  gmail_message_id text not null,
  from_email       text,
  subject          text,
  status           text not null check (status in ('processed', 'no_match', 'no_attachment', 'error')),
  detail           text,
  candidate_id     uuid references candidates(id) on delete set null,
  created_at       timestamptz not null default now(),
  -- never process the same Gmail message twice
  unique (organization_id, gmail_message_id)
);

create index if not exists idx_ingestion_logs_org on ingestion_logs(organization_id);

alter table ingestion_logs enable row level security;

drop policy if exists "Org members can view ingestion logs" on ingestion_logs;
create policy "Org members can view ingestion logs"
  on ingestion_logs for select
  using (get_user_org_role(organization_id, auth.uid()) is not null);

drop policy if exists "Admins and recruiters can insert ingestion logs" on ingestion_logs;
create policy "Admins and recruiters can insert ingestion logs"
  on ingestion_logs for insert
  with check (get_user_org_role(organization_id, auth.uid()) in ('admin', 'recruiter'));
