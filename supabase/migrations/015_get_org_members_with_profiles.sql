-- Migration 015: RPC to fetch org members with user display names
-- Runs as DB owner (SECURITY DEFINER) to access auth.users metadata.
-- Returns one row per member with full_name and email pulled from auth.users.

create or replace function get_org_members_with_profiles(p_org_id uuid)
returns table (
  id              uuid,
  user_id         uuid,
  organization_id uuid,
  role            text,
  created_at      timestamptz,
  full_name       text,
  email           text
)
language sql
security definer
set search_path = public
as $$
  select
    om.id,
    om.user_id,
    om.organization_id,
    om.role,
    om.created_at,
    coalesce(
      nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
      u.email
    ) as full_name,
    u.email
  from public.organization_members om
  join auth.users u on u.id = om.user_id
  where om.organization_id = p_org_id
  order by om.created_at asc;
$$;

revoke all on function get_org_members_with_profiles(uuid) from public;
grant execute on function get_org_members_with_profiles(uuid) to authenticated;
