-- ============================================================================
-- Migration 020: Platform Administration layer (SUPER_ADMIN)
--
-- Introduces a platform-level administration tier that sits ABOVE organizations.
-- Design guarantees:
--   * SUPER_ADMIN lives in its own table (platform_admins) — it is NEVER an
--     organization role, so an org admin can never structurally gain it.
--   * All cross-org reads/writes happen through SECURITY DEFINER RPCs that each
--     begin with an `is_platform_admin(auth.uid())` guard. Existing tenant RLS
--     policies are left completely untouched (no regression risk).
--   * Org suspension is additive: a `status` column on organizations that write
--     paths consult. Reads remain fully enabled (users can still log in / view).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. platform_admins — the SUPER_ADMIN allowlist (source of truth)
-- ----------------------------------------------------------------------------
create table if not exists platform_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

alter table platform_admins enable row level security;
-- No permissive policies: platform_admins is only ever read via the
-- SECURITY DEFINER helper below. PostgREST/authenticated clients get nothing.

-- ----------------------------------------------------------------------------
-- 2. is_platform_admin() — SECURITY DEFINER guard used everywhere
-- ----------------------------------------------------------------------------
create or replace function is_platform_admin(p_user_id uuid)
returns boolean
security definer
set search_path = public
language sql
as $$
  select exists (
    select 1 from platform_admins where user_id = p_user_id
  );
$$;

grant execute on function is_platform_admin(uuid) to authenticated;

-- Convenience wrapper for the current session (used by the app layout guard).
create or replace function am_i_platform_admin()
returns boolean
security definer
set search_path = public
language sql
as $$
  select is_platform_admin(auth.uid());
$$;

grant execute on function am_i_platform_admin() to authenticated;

-- ----------------------------------------------------------------------------
-- 3. Organization status (active / suspended)
-- ----------------------------------------------------------------------------
alter table organizations
  add column if not exists status text not null default 'active'
    check (status in ('active', 'suspended'));

create index if not exists idx_organizations_status on organizations(status);

-- SECURITY DEFINER helper so tenant server actions can cheaply check status
-- without needing a permissive policy path.
create or replace function org_is_active(p_org_id uuid)
returns boolean
security definer
set search_path = public
language sql
as $$
  select coalesce(
    (select status = 'active' from organizations where id = p_org_id),
    true  -- unknown org id: don't block (fail open for reads/legacy rows)
  );
$$;

grant execute on function org_is_active(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 4. platform_audit_logs — platform-level action trail (distinct from the
--    org-scoped audit_logs table that tracks candidate stage changes).
-- ----------------------------------------------------------------------------
create table if not exists platform_audit_logs (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references auth.users(id) on delete set null,
  actor_email  text,
  action       text not null,   -- e.g. 'org_suspended', 'org_reactivated'
  target_type  text,            -- 'organization' | 'user' | 'platform'
  target_id    uuid,
  target_label text,            -- human-readable name at time of action
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists idx_platform_audit_created on platform_audit_logs(created_at desc);

alter table platform_audit_logs enable row level security;
-- Reads happen only through the guarded RPC below; writes only through the
-- SECURITY DEFINER action RPCs. No direct-client policies.

-- ----------------------------------------------------------------------------
-- 5. Read RPCs — every one is guarded by is_platform_admin(auth.uid())
-- ----------------------------------------------------------------------------

-- Aggregate platform statistics (real data only — no fabricated metrics).
create or replace function get_platform_stats()
returns jsonb
security definer
set search_path = public
language plpgsql
as $$
declare
  result jsonb;
begin
  if not is_platform_admin(auth.uid()) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'total_organizations', (select count(*) from organizations),
    'active_organizations', (select count(*) from organizations where status = 'active'),
    'suspended_organizations', (select count(*) from organizations where status = 'suspended'),
    'total_users',         (select count(distinct user_id) from organization_members),
    'total_admins',        (select count(*) from organization_members where role = 'admin'),
    'total_recruiters',    (select count(*) from organization_members where role = 'recruiter'),
    'total_interviewers',  (select count(*) from organization_members where role = 'interviewer'),
    'total_candidates',    (select count(*) from candidates),
    'total_job_posts',     (select count(*) from job_posts),
    'total_interviews',    (select count(*) from interviews),
    'total_ai_evaluations',(select count(*) from candidates where ai_status = 'completed'),
    'total_emails_sent',   (select count(*) from email_events where status = 'sent')
  ) into result;

  return result;
end;
$$;

grant execute on function get_platform_stats() to authenticated;

-- AI usage breakdown (real counts; estimated figure clearly derived, not invented).
create or replace function get_platform_ai_usage()
returns jsonb
security definer
set search_path = public
language plpgsql
as $$
declare
  v_evals   bigint;
  v_parsing bigint;
  v_recs    bigint;
begin
  if not is_platform_admin(auth.uid()) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select count(*) into v_evals   from candidates    where ai_status = 'completed';
  select count(*) into v_parsing from ingestion_logs where status = 'processed';
  select count(*) into v_recs    from candidates    where ai_recommendation is not null;

  return jsonb_build_object(
    'evaluations_performed',          v_evals,
    'resume_parsing_count',           v_parsing,
    'recommendation_generation_count',v_recs,
    -- Derived total of billable AI operations. This is a COUNT of real
    -- operations, not a fabricated token/cost estimate.
    'estimated_ai_operations',        v_evals + v_parsing + v_recs
  );
end;
$$;

grant execute on function get_platform_ai_usage() to authenticated;

-- Organizations list with owner + member counts, searchable / filterable.
create or replace function get_platform_organizations(
  p_search text default null,
  p_status text default null
)
returns table (
  id            uuid,
  name          text,
  status        text,
  created_at    timestamptz,
  owner_email   text,
  owner_name    text,
  member_count  bigint,
  candidate_count bigint,
  job_post_count  bigint
)
security definer
set search_path = public
language plpgsql
as $$
begin
  if not is_platform_admin(auth.uid()) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  return query
    select
      o.id,
      o.name,
      o.status,
      o.created_at,
      owner.email::text as owner_email,
      coalesce(nullif(trim(owner.raw_user_meta_data->>'full_name'), ''), owner.email)::text as owner_name,
      (select count(*) from organization_members m where m.organization_id = o.id) as member_count,
      (select count(*) from candidates c where c.organization_id = o.id) as candidate_count,
      (select count(*) from job_posts j where j.organization_id = o.id) as job_post_count
    from organizations o
    left join auth.users owner on owner.id = o.created_by
    where (p_status is null or o.status = p_status)
      and (
        p_search is null
        or o.name ilike '%' || p_search || '%'
        or owner.email ilike '%' || p_search || '%'
      )
    order by o.created_at desc;
end;
$$;

grant execute on function get_platform_organizations(text, text) to authenticated;

-- Single organization detail.
create or replace function get_platform_organization(p_org_id uuid)
returns table (
  id            uuid,
  name          text,
  status        text,
  created_at    timestamptz,
  owner_email   text,
  owner_name    text,
  member_count  bigint,
  candidate_count bigint,
  job_post_count  bigint,
  interview_count bigint
)
security definer
set search_path = public
language plpgsql
as $$
begin
  if not is_platform_admin(auth.uid()) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  return query
    select
      o.id,
      o.name,
      o.status,
      o.created_at,
      owner.email::text as owner_email,
      coalesce(nullif(trim(owner.raw_user_meta_data->>'full_name'), ''), owner.email)::text as owner_name,
      (select count(*) from organization_members m where m.organization_id = o.id) as member_count,
      (select count(*) from candidates c where c.organization_id = o.id) as candidate_count,
      (select count(*) from job_posts j where j.organization_id = o.id) as job_post_count,
      (select count(*) from interviews i where i.organization_id = o.id) as interview_count
    from organizations o
    left join auth.users owner on owner.id = o.created_by
    where o.id = p_org_id;
end;
$$;

grant execute on function get_platform_organization(uuid) to authenticated;

-- All members across all orgs, searchable and filterable by role.
create or replace function get_platform_users(
  p_search text default null,
  p_role   text default null
)
returns table (
  user_id         uuid,
  full_name       text,
  email           text,
  role            text,
  organization_id uuid,
  organization_name text,
  org_status      text,
  joined_at       timestamptz,
  last_sign_in_at timestamptz
)
security definer
set search_path = public
language plpgsql
as $$
begin
  if not is_platform_admin(auth.uid()) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  return query
    select
      m.user_id,
      coalesce(nullif(trim(u.raw_user_meta_data->>'full_name'), ''), u.email)::text as full_name,
      u.email::text,
      m.role,
      m.organization_id,
      o.name   as organization_name,
      o.status as org_status,
      m.created_at as joined_at,
      u.last_sign_in_at
    from organization_members m
    join auth.users     u on u.id = m.user_id
    join organizations  o on o.id = m.organization_id
    where (p_role is null or m.role = p_role)
      and (
        p_search is null
        or u.email ilike '%' || p_search || '%'
        or coalesce(u.raw_user_meta_data->>'full_name', '') ilike '%' || p_search || '%'
        or o.name ilike '%' || p_search || '%'
      )
    order by m.created_at desc;
end;
$$;

grant execute on function get_platform_users(text, text) to authenticated;

-- Platform audit log feed.
create or replace function get_platform_audit_logs(p_limit int default 200)
returns table (
  id           uuid,
  actor_email  text,
  action       text,
  target_type  text,
  target_id    uuid,
  target_label text,
  metadata     jsonb,
  created_at   timestamptz
)
security definer
set search_path = public
language plpgsql
as $$
begin
  if not is_platform_admin(auth.uid()) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  return query
    select l.id, l.actor_email, l.action, l.target_type, l.target_id,
           l.target_label, l.metadata, l.created_at
    from platform_audit_logs l
    order by l.created_at desc
    limit greatest(1, least(p_limit, 500));
end;
$$;

grant execute on function get_platform_audit_logs(int) to authenticated;

-- ----------------------------------------------------------------------------
-- 6. Write RPC — suspend / reactivate an organization (guarded + audited)
-- ----------------------------------------------------------------------------
create or replace function platform_set_org_status(
  p_org_id uuid,
  p_status text
)
returns void
security definer
set search_path = public
language plpgsql
as $$
declare
  v_actor       uuid := auth.uid();
  v_actor_email text;
  v_org_name    text;
begin
  if not is_platform_admin(v_actor) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if p_status not in ('active', 'suspended') then
    raise exception 'Invalid status: %', p_status using errcode = '22023';
  end if;

  select name into v_org_name from organizations where id = p_org_id;
  if v_org_name is null then
    raise exception 'Organization not found' using errcode = 'P0002';
  end if;

  select email into v_actor_email from auth.users where id = v_actor;

  update organizations set status = p_status where id = p_org_id;

  insert into platform_audit_logs (actor_id, actor_email, action, target_type, target_id, target_label)
  values (
    v_actor,
    v_actor_email,
    case when p_status = 'suspended' then 'org_suspended' else 'org_reactivated' end,
    'organization',
    p_org_id,
    v_org_name
  );
end;
$$;

grant execute on function platform_set_org_status(uuid, text) to authenticated;

-- ----------------------------------------------------------------------------
-- 7. Bootstrap the first SUPER_ADMIN.
--    Seeded by email. CHANGE THE EMAIL BELOW to your platform-owner login.
--    Also mirrors a spoof-proof `platform_admin` claim into app_metadata so the
--    Next.js middleware can gate /platform without a DB round-trip.
-- ----------------------------------------------------------------------------
do $$
declare
  v_uid uuid;
  v_bootstrap_email text := 'avancena.johnilo@gmail.com';  -- ← change if needed
begin
  select id into v_uid from auth.users where email = v_bootstrap_email;

  if v_uid is not null then
    insert into platform_admins (user_id, created_by)
    values (v_uid, v_uid)
    on conflict (user_id) do nothing;

    update auth.users
    set raw_app_meta_data =
      coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('platform_admin', true)
    where id = v_uid;
  else
    raise notice 'Bootstrap skipped: no auth user with email %. Register that account, then re-run this DO block.', v_bootstrap_email;
  end if;
end $$;

notify pgrst, 'reload schema';
