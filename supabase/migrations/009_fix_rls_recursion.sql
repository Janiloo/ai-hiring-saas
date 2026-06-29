-- ============================================================
-- Drop all existing policies on the three tables
-- ============================================================

drop policy if exists "Authenticated users can create orgs"  on organizations;
drop policy if exists "Members can view their org"            on organizations;
drop policy if exists "Admins can update their org"           on organizations;

drop policy if exists "Members can view org members"          on organization_members;
drop policy if exists "Admins can manage members"             on organization_members;
drop policy if exists "Creator becomes first admin"           on organization_members;
drop policy if exists "Invited user can join org"             on organization_members;
drop policy if exists "Members can leave org"                 on organization_members;

drop policy if exists "Admins manage invitations"             on invitations;
drop policy if exists "Invitee can read own invitation"       on invitations;
drop policy if exists "Invitee can accept invitation"         on invitations;


-- ============================================================
-- SECURITY DEFINER helpers
--
-- These functions run as the DB owner, bypassing RLS entirely.
-- This breaks the recursion: no RLS policy will ever query
-- organization_members from inside an organization_members policy.
-- ============================================================

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
  return v_role;   -- null when not a member
end;
$$;

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


-- ============================================================
-- organizations policies
-- ============================================================

-- Any authenticated user may create an org
create policy "Authenticated users can create orgs"
  on organizations for insert
  with check (auth.uid() is not null);

-- Only members of the org may read it
create policy "Members can view their org"
  on organizations for select
  using (get_user_org_role(id, auth.uid()) is not null);

-- Only admins may update the org
create policy "Admins can update their org"
  on organizations for update
  using (get_user_org_role(id, auth.uid()) = 'admin');


-- ============================================================
-- organization_members policies  (NO self-referencing queries)
-- ============================================================

-- Members may see other members of their own org
create policy "Members can view org members"
  on organization_members for select
  using (get_user_org_role(organization_id, auth.uid()) is not null);

-- The first person to join a brand-new org becomes its admin.
-- org_has_members() is SECURITY DEFINER — no recursion.
create policy "Creator becomes first admin"
  on organization_members for insert
  with check (
    user_id = auth.uid()
    and role = 'admin'
    and not org_has_members(organization_id)
  );

-- Invited users join with the exact role stored in the DB invitation.
-- Role comes from invitations.role — never from the client.
create policy "Invited user can join org"
  on organization_members for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from invitations i
      where i.email           = auth.email()
      and   i.organization_id = organization_members.organization_id
      and   i.role            = organization_members.role
      and   i.status          = 'pending'
      and   i.expires_at      > now()
    )
  );

-- Admins may update any member row in their org
create policy "Admins can update members"
  on organization_members for update
  using (get_user_org_role(organization_id, auth.uid()) = 'admin');

-- Admins may remove members; any member may remove themselves
create policy "Admins or self can delete members"
  on organization_members for delete
  using (
    user_id = auth.uid()
    or get_user_org_role(organization_id, auth.uid()) = 'admin'
  );


-- ============================================================
-- invitations policies
-- ============================================================

-- Admins have full control over invitations in their org
create policy "Admins manage invitations"
  on invitations for all
  using     (get_user_org_role(organization_id, auth.uid()) = 'admin')
  with check(get_user_org_role(organization_id, auth.uid()) = 'admin');

-- Invitee can read their own invitation (for the accept page when signed in)
create policy "Invitee can read own invitation"
  on invitations for select
  using (email = auth.email());

-- Invitee can mark their own pending invitation as accepted
create policy "Invitee can accept invitation"
  on invitations for update
  using  (email = auth.email() and status = 'pending')
  with check (status = 'accepted');
