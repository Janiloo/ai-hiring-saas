-- ============================================================
-- Org-scope candidate_activity_logs and email_drafts.
--
-- Previous policies used auth.uid() = user_id, which means
-- users could only see records they personally created.
-- In a multi-user org, all org members need to see the full
-- activity history and email drafts for shared candidates.
-- ============================================================


-- ============================================================
-- candidate_activity_logs
-- ============================================================

drop policy if exists "Users read their own activity logs"   on candidate_activity_logs;
drop policy if exists "Users insert their own activity logs" on candidate_activity_logs;

-- Any org member can view activity logs for candidates in their org.
-- Uses the existing org-scoped candidates RLS (get_user_org_role on
-- candidates.organization_id) without a direct self-reference.
create policy "Org members can view activity logs"
  on candidate_activity_logs for select
  using (
    exists (
      select 1 from candidates c
      where c.id = candidate_activity_logs.candidate_id
        and get_user_org_role(c.organization_id, auth.uid()) is not null
    )
  );

-- Only admin and recruiter may append activity log entries.
-- Interviewers cannot add logs directly (they have no write-path actions).
create policy "Admin or recruiter can insert activity logs"
  on candidate_activity_logs for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from candidates c
      where c.id = candidate_activity_logs.candidate_id
        and get_user_org_role(c.organization_id, auth.uid()) in ('admin', 'recruiter')
    )
  );


-- ============================================================
-- email_drafts
-- ============================================================

drop policy if exists "Users manage their own email drafts" on email_drafts;

-- Admin and recruiter can see all drafts for candidates in their org.
create policy "Admin or recruiter can view email drafts"
  on email_drafts for select
  using (
    exists (
      select 1 from candidates c
      where c.id = email_drafts.candidate_id
        and get_user_org_role(c.organization_id, auth.uid()) in ('admin', 'recruiter')
    )
  );

-- Admin and recruiter can create drafts.
create policy "Admin or recruiter can insert email drafts"
  on email_drafts for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from candidates c
      where c.id = email_drafts.candidate_id
        and get_user_org_role(c.organization_id, auth.uid()) in ('admin', 'recruiter')
    )
  );

-- Admin and recruiter can update drafts (approve / reject).
create policy "Admin or recruiter can update email drafts"
  on email_drafts for update
  using (
    exists (
      select 1 from candidates c
      where c.id = email_drafts.candidate_id
        and get_user_org_role(c.organization_id, auth.uid()) in ('admin', 'recruiter')
    )
  );

-- Only admin can delete drafts.
create policy "Admin can delete email drafts"
  on email_drafts for delete
  using (
    exists (
      select 1 from candidates c
      where c.id = email_drafts.candidate_id
        and get_user_org_role(c.organization_id, auth.uid()) = 'admin'
    )
  );


-- ============================================================
-- Fix the "Invited user can join org" INSERT policy to be
-- case-insensitive on email comparison. Supabase stores the
-- email in lower-case, but auth.email() may vary.
-- ============================================================

drop policy if exists "Invited user can join org" on organization_members;

create policy "Invited user can join org"
  on organization_members for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from invitations i
      where lower(i.email)      = lower(auth.email())
      and   i.organization_id   = organization_members.organization_id
      and   i.role              = organization_members.role
      and   i.status            = 'pending'
      and   i.expires_at        > now()
    )
  );


notify pgrst, 'reload schema';
