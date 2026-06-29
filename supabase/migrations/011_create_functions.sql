-- ============================================================
-- Create all three SECURITY DEFINER helper functions.
-- Run this if the functions are missing from the schema cache.
-- ============================================================

-- Returns the role of a user in an org, or NULL if not a member.
-- SECURITY DEFINER bypasses RLS — prevents infinite recursion in policies.
create or replace function get_user_org_role(p_org_id uuid, p_user_id uuid)
returns text
security definer
set search_path = public
language plpgsql
as $$
declare
  v_role text;
begin
  select role into v_role
  from   organization_members
  where  organization_id = p_org_id
    and  user_id         = p_user_id
  limit 1;
  return v_role;
end;
$$;

-- Returns true if the org already has at least one member.
-- SECURITY DEFINER bypasses RLS — used in "Creator becomes first admin" policy.
create or replace function org_has_members(p_org_id uuid)
returns boolean
security definer
set search_path = public
language plpgsql
as $$
begin
  return exists (
    select 1 from organization_members
    where organization_id = p_org_id
  );
end;
$$;

-- Looks up an invitation by its token and returns safe fields only.
-- SECURITY DEFINER allows unauthenticated callers — the 256-bit token IS the secret.
-- Never exposes the raw token column.
create or replace function get_invitation_by_token(p_token text)
returns table (
  id              uuid,
  email           text,
  role            text,
  organization_id uuid,
  org_name        text,
  status          text,
  expires_at      timestamptz
)
security definer
set search_path = public
language plpgsql
as $$
begin
  return query
    select
      i.id,
      i.email,
      i.role,
      i.organization_id,
      o.name  as org_name,
      i.status,
      i.expires_at
    from  invitations   i
    join  organizations o on o.id = i.organization_id
    where i.token = p_token;
end;
$$;

-- ============================================================
-- Grant EXECUTE to both roles so PostgREST can call them.
-- ============================================================

grant execute on function get_user_org_role(uuid, uuid) to anon, authenticated;
grant execute on function org_has_members(uuid)          to anon, authenticated;
grant execute on function get_invitation_by_token(text)  to anon, authenticated;

-- ============================================================
-- Grant table-level SELECT so PostgREST resolves return types.
-- Row visibility is still controlled by existing RLS policies.
-- ============================================================

grant select on organizations        to anon, authenticated;
grant select on organization_members to anon, authenticated;
grant select on invitations          to anon, authenticated;

-- ============================================================
-- Reload PostgREST schema cache so it picks up the new functions.
-- ============================================================

notify pgrst, 'reload schema';
