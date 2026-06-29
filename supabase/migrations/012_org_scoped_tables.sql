-- ============================================================
-- Add organization_id to the three core tables so data is
-- scoped by org, not by individual user_id.
-- ============================================================

alter table job_posts  add column if not exists organization_id uuid references organizations(id) on delete set null;
alter table candidates add column if not exists organization_id uuid references organizations(id) on delete set null;
alter table interviews  add column if not exists organization_id uuid references organizations(id) on delete set null;

-- Indexes
create index if not exists idx_job_posts_org  on job_posts(organization_id);
create index if not exists idx_candidates_org on candidates(organization_id);
create index if not exists idx_interviews_org  on interviews(organization_id);

-- ============================================================
-- Backfill existing rows using the creator's org membership
-- ============================================================

update job_posts
set organization_id = (
  select organization_id from organization_members
  where user_id = job_posts.user_id limit 1
)
where organization_id is null;

update candidates
set organization_id = (
  select organization_id from organization_members
  where user_id = candidates.user_id limit 1
)
where organization_id is null;

update interviews
set organization_id = (
  select organization_id from organization_members
  where user_id = interviews.user_id limit 1
)
where organization_id is null;

-- ============================================================
-- Drop the old single-user policies
-- ============================================================

drop policy if exists "Users manage their own job posts"  on job_posts;
drop policy if exists "Users manage their own candidates" on candidates;
drop policy if exists "Users manage their own interviews" on interviews;

-- ============================================================
-- job_posts — org-scoped policies
-- Admin / Recruiter: full CRUD
-- Interviewer:       read-only
-- ============================================================

create policy "Org members can view job posts"
  on job_posts for select
  using (get_user_org_role(organization_id, auth.uid()) is not null);

create policy "Admin or recruiter can insert job posts"
  on job_posts for insert
  with check (
    organization_id is not null
    and get_user_org_role(organization_id, auth.uid()) in ('admin', 'recruiter')
  );

create policy "Admin or recruiter can update job posts"
  on job_posts for update
  using (get_user_org_role(organization_id, auth.uid()) in ('admin', 'recruiter'));

create policy "Admin or creator can delete job posts"
  on job_posts for delete
  using (
    user_id = auth.uid()
    or get_user_org_role(organization_id, auth.uid()) = 'admin'
  );

-- ============================================================
-- candidates — org-scoped policies
-- ============================================================

create policy "Org members can view candidates"
  on candidates for select
  using (get_user_org_role(organization_id, auth.uid()) is not null);

create policy "Admin or recruiter can insert candidates"
  on candidates for insert
  with check (
    organization_id is not null
    and get_user_org_role(organization_id, auth.uid()) in ('admin', 'recruiter')
  );

create policy "Admin or recruiter can update candidates"
  on candidates for update
  using (get_user_org_role(organization_id, auth.uid()) in ('admin', 'recruiter'));

create policy "Admin or creator can delete candidates"
  on candidates for delete
  using (
    user_id = auth.uid()
    or get_user_org_role(organization_id, auth.uid()) = 'admin'
  );

-- ============================================================
-- interviews — org-scoped policies
-- ============================================================

create policy "Org members can view interviews"
  on interviews for select
  using (get_user_org_role(organization_id, auth.uid()) is not null);

create policy "Admin or recruiter can insert interviews"
  on interviews for insert
  with check (
    organization_id is not null
    and get_user_org_role(organization_id, auth.uid()) in ('admin', 'recruiter')
  );

create policy "Admin or recruiter can update interviews"
  on interviews for update
  using (get_user_org_role(organization_id, auth.uid()) in ('admin', 'recruiter'));

create policy "Admin or creator can delete interviews"
  on interviews for delete
  using (
    user_id = auth.uid()
    or get_user_org_role(organization_id, auth.uid()) = 'admin'
  );

-- ============================================================
-- Grant SELECT on core tables so org members can read via RLS
-- ============================================================

grant select, insert, update, delete on job_posts  to authenticated;
grant select, insert, update, delete on candidates  to authenticated;
grant select, insert, update, delete on interviews  to authenticated;

notify pgrst, 'reload schema';
