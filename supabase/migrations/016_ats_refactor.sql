-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 016: ATS refactor — strict pipeline state machine, interview
-- reports, audit logs, interviewer-scoped RLS, email event outbox.
--
-- CORE PRINCIPLE:
--   Pipeline (candidates.stage) = ONLY hiring lifecycle state
--   Interviews = separate scheduling module (never a pipeline state)
--   Interviewers = evaluation only (interview_reports), no pipeline control
-- ═══════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PIPELINE STATES — collapse duplicates, constrain to the 7 valid values
--    applied → screening → shortlisted → interview → decision → hired/rejected
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop the old constraint FIRST — it only allows the legacy stage values and
-- would reject the data migration below.
alter table candidates drop constraint if exists candidates_stage_check;

-- Map legacy stages onto the new state machine
update candidates set stage = 'interview' where stage in ('interview_scheduled', 'interview_completed');
update candidates set stage = 'decision'  where stage = 'offer_sent';

-- Enforce: no invalid stage can ever be written again
alter table candidates add constraint candidates_stage_check
  check (stage in ('applied', 'screening', 'shortlisted', 'interview', 'decision', 'hired', 'rejected'));

alter table candidates alter column stage set default 'applied';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. INTERVIEWS — add interviewer_id (FK to auth.users)
--    interviewer (text) is kept as a denormalized display name.
-- ─────────────────────────────────────────────────────────────────────────────

alter table interviews add column if not exists interviewer_id uuid references auth.users(id) on delete set null;
create index if not exists idx_interviews_interviewer_id on interviews(interviewer_id);
create index if not exists idx_interviews_organization_id on interviews(organization_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. INTERVIEW REPORTS — evaluation data only, never touches pipeline
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists interview_reports (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  interview_id    uuid not null references interviews(id) on delete cascade,
  candidate_id    uuid not null references candidates(id) on delete cascade,
  interviewer_id  uuid not null references auth.users(id) on delete cascade,
  rating          integer not null check (rating between 1 and 5),
  notes           text,
  recommendation  text not null check (recommendation in ('pass', 'fail', 'maybe')),
  created_at      timestamptz not null default now(),
  -- one report per interviewer per interview
  unique (interview_id, interviewer_id)
);

create index if not exists idx_interview_reports_org       on interview_reports(organization_id);
create index if not exists idx_interview_reports_candidate on interview_reports(candidate_id);

alter table interview_reports enable row level security;

-- Any org member can read reports (recruiters/admins review; interviewer sees own org)
create policy "Org members can view interview reports"
  on interview_reports for select
  using (get_user_org_role(organization_id, auth.uid()) is not null);

-- Only the assigned interviewer may submit a report, only for their own interview
create policy "Assigned interviewer can submit report"
  on interview_reports for insert
  with check (
    interviewer_id = auth.uid()
    and get_user_org_role(organization_id, auth.uid()) is not null
    and exists (
      select 1 from interviews i
      where i.id = interview_id
        and i.interviewer_id = auth.uid()
        and i.organization_id = interview_reports.organization_id
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. AUDIT LOGS — every pipeline change recorded, enforced at the DB level
--    via trigger so it is consistent under concurrent users and cannot be
--    bypassed by application code.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists audit_logs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  candidate_id    uuid references candidates(id) on delete set null,
  action          text not null,
  from_status     text,
  to_status       text,
  performed_by    uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_audit_logs_org       on audit_logs(organization_id);
create index if not exists idx_audit_logs_candidate on audit_logs(candidate_id);

alter table audit_logs enable row level security;

-- Read: org members only. Insert: system trigger only (security definer) — no
-- direct insert policy means clients cannot forge audit entries.
create policy "Org members can view audit logs"
  on audit_logs for select
  using (get_user_org_role(organization_id, auth.uid()) is not null);

-- Trigger: automatically audit every candidate stage change
create or replace function audit_candidate_stage_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into audit_logs (organization_id, candidate_id, action, from_status, to_status, performed_by)
    values (new.organization_id, new.id, 'CANDIDATE_CREATED', null, new.stage, auth.uid());
  elsif tg_op = 'UPDATE' and new.stage is distinct from old.stage then
    insert into audit_logs (organization_id, candidate_id, action, from_status, to_status, performed_by)
    values (new.organization_id, new.id, 'STAGE_CHANGED', old.stage, new.stage, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_audit_candidate_stage on candidates;
create trigger trg_audit_candidate_stage
  after insert or update on candidates
  for each row execute function audit_candidate_stage_change();


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. INTERVIEWER RLS — interviewers only see interviews assigned to them.
--    Admins/recruiters see all org interviews.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "Org members can view interviews" on interviews;
drop policy if exists "Users can view own interviews" on interviews;

create policy "Org-scoped interview visibility"
  on interviews for select
  using (
    -- admin / recruiter: all org interviews
    get_user_org_role(organization_id, auth.uid()) in ('admin', 'recruiter')
    -- interviewer: only interviews assigned to them
    or (
      get_user_org_role(organization_id, auth.uid()) = 'interviewer'
      and interviewer_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. EMAIL EVENTS OUTBOX — event-driven email queue. Rows are written by DB
--    triggers (never by the UI); backend logic delivers and marks them sent.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists email_events (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  candidate_id    uuid references candidates(id) on delete cascade,
  event_type      text not null,
  payload         jsonb not null default '{}',
  status          text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  created_at      timestamptz not null default now(),
  sent_at         timestamptz
);

create index if not exists idx_email_events_status on email_events(status) where status = 'pending';
create index if not exists idx_email_events_org    on email_events(organization_id);

alter table email_events enable row level security;

create policy "Org members can view email events"
  on email_events for select
  using (get_user_org_role(organization_id, auth.uid()) is not null);

-- Backend (authenticated server actions) may mark events processed
create policy "Org admins and recruiters can update email events"
  on email_events for update
  using (get_user_org_role(organization_id, auth.uid()) in ('admin', 'recruiter'));

-- Trigger: enqueue email events on pipeline stage changes
create or replace function enqueue_pipeline_email_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event text;
begin
  if tg_op = 'INSERT' then
    v_event := 'candidate_applied';
  elsif tg_op = 'UPDATE' and new.stage is distinct from old.stage then
    v_event := case new.stage
      when 'screening'   then 'candidate_screening'
      when 'shortlisted' then 'candidate_shortlisted'
      when 'decision'    then 'candidate_decision'
      when 'hired'       then 'candidate_hired'
      when 'rejected'    then 'candidate_rejected'
      else null
    end;
  end if;

  if v_event is not null then
    insert into email_events (organization_id, candidate_id, event_type, payload)
    values (
      new.organization_id,
      new.id,
      v_event,
      jsonb_build_object(
        'candidate_name',  new.full_name,
        'candidate_email', new.email,
        'stage',           new.stage
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enqueue_pipeline_emails on candidates;
create trigger trg_enqueue_pipeline_emails
  after insert or update on candidates
  for each row execute function enqueue_pipeline_email_events();

-- Trigger: enqueue events when an interview is scheduled
create or replace function enqueue_interview_email_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.organization_id is not null then
    insert into email_events (organization_id, candidate_id, event_type, payload)
    values (
      new.organization_id,
      new.candidate_id,
      'interview_scheduled',
      jsonb_build_object(
        'interview_id',   new.id,
        'interviewer_id', new.interviewer_id,
        'scheduled_at',   new.scheduled_at
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enqueue_interview_emails on interviews;
create trigger trg_enqueue_interview_emails
  after insert on interviews
  for each row execute function enqueue_interview_email_events();

-- Trigger: enqueue event when an interview report is submitted, and mark the
-- interview completed (system behavior, not interviewer pipeline control)
create or replace function on_interview_report_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update interviews set status = 'completed' where id = new.interview_id;

  insert into email_events (organization_id, candidate_id, event_type, payload)
  values (
    new.organization_id,
    new.candidate_id,
    'interview_report_submitted',
    jsonb_build_object(
      'interview_id',   new.interview_id,
      'rating',         new.rating,
      'recommendation', new.recommendation
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_on_interview_report on interview_reports;
create trigger trg_on_interview_report
  after insert on interview_reports
  for each row execute function on_interview_report_submitted();
