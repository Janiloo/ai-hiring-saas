-- ============================================================
-- Step 1: Create all tables first (no cross-references yet)
-- ============================================================

create table if not exists organizations (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  created_by uuid        references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists organization_members (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  organization_id uuid        not null references organizations(id) on delete cascade,
  role            text        not null check (role in ('admin', 'recruiter', 'interviewer')),
  created_at      timestamptz not null default now(),
  unique (user_id, organization_id)
);

create index if not exists org_members_user_id_idx on organization_members(user_id);
create index if not exists org_members_org_id_idx  on organization_members(organization_id);

create table if not exists invitations (
  id              uuid        primary key default gen_random_uuid(),
  email           text        not null,
  role            text        not null check (role in ('admin', 'recruiter', 'interviewer')),
  organization_id uuid        not null references organizations(id) on delete cascade,
  invited_by      uuid        not null references auth.users(id) on delete cascade,
  token           text        not null unique,
  status          text        not null default 'pending'
                    check (status in ('pending', 'accepted', 'expired', 'revoked')),
  expires_at      timestamptz not null,
  created_at      timestamptz not null default now(),
  accepted_at     timestamptz
);

create index if not exists invitations_email_idx  on invitations(email);
create index if not exists invitations_token_idx  on invitations(token);
create index if not exists invitations_org_idx    on invitations(organization_id);
create index if not exists invitations_status_idx on invitations(status);


-- ============================================================
-- Step 2: Enable RLS on all tables
-- ============================================================

alter table organizations         enable row level security;
alter table organization_members  enable row level security;
alter table invitations           enable row level security;


-- ============================================================
-- Step 3: organizations policies
-- (organization_members now exists, so cross-references are safe)
-- ============================================================

create policy "Authenticated users can create orgs"
  on organizations for insert
  with check (auth.uid() is not null);

create policy "Members can view their org"
  on organizations for select
  using (
    exists (
      select 1 from organization_members om
      where om.user_id         = auth.uid()
      and   om.organization_id = organizations.id
    )
  );

create policy "Admins can update their org"
  on organizations for update
  using (
    exists (
      select 1 from organization_members om
      where om.user_id         = auth.uid()
      and   om.organization_id = organizations.id
      and   om.role            = 'admin'
    )
  );


-- ============================================================
-- Step 4: organization_members policies
-- ============================================================

create policy "Members can view org members"
  on organization_members for select
  using (
    exists (
      select 1 from organization_members om
      where om.user_id         = auth.uid()
      and   om.organization_id = organization_members.organization_id
    )
  );

create policy "Admins can manage members"
  on organization_members for all
  using (
    exists (
      select 1 from organization_members om
      where om.user_id         = auth.uid()
      and   om.organization_id = organization_members.organization_id
      and   om.role            = 'admin'
    )
  )
  with check (
    exists (
      select 1 from organization_members om
      where om.user_id         = auth.uid()
      and   om.organization_id = organization_members.organization_id
      and   om.role            = 'admin'
    )
  );

-- First user to join an org becomes its admin (no prior members exist)
create policy "Creator becomes first admin"
  on organization_members for insert
  with check (
    user_id = auth.uid()
    and role = 'admin'
    and not exists (
      select 1 from organization_members existing
      where existing.organization_id = organization_members.organization_id
    )
  );

-- Invited users can join with the exact role from the DB invitation record
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

create policy "Members can leave org"
  on organization_members for delete
  using (user_id = auth.uid());


-- ============================================================
-- Step 5: invitations policies
-- ============================================================

create policy "Admins manage invitations"
  on invitations for all
  using (
    exists (
      select 1 from organization_members om
      where om.user_id         = auth.uid()
      and   om.organization_id = invitations.organization_id
      and   om.role            = 'admin'
    )
  )
  with check (
    exists (
      select 1 from organization_members om
      where om.user_id         = auth.uid()
      and   om.organization_id = invitations.organization_id
      and   om.role            = 'admin'
    )
  );

create policy "Invitee can read own invitation"
  on invitations for select
  using (email = auth.email());

create policy "Invitee can accept invitation"
  on invitations for update
  using  (email = auth.email() and status = 'pending')
  with check (status = 'accepted');


-- ============================================================
-- Step 6: SECURITY DEFINER function for unauthenticated token lookup
-- ============================================================

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
