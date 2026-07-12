-- ============================================================================
-- Migration 021: Fix return-type mismatch in three platform RPCs.
--
-- auth.users.email is `varchar`, but get_platform_organizations /
-- get_platform_organization / get_platform_users declared the corresponding
-- return columns as `text`. Postgres is strict about RETURNS TABLE types and
-- raised "structure of query does not match function result type". Fixed by
-- casting the auth.users columns to ::text. (Migration 020 has been corrected
-- for fresh installs; this migration repairs databases that already ran 020.)
-- ============================================================================

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

notify pgrst, 'reload schema';
