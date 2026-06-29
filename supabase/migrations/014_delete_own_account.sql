-- Migration 014: SECURITY DEFINER function for user self-deletion
-- Allows an authenticated user to delete their own auth.users row
-- without needing the service-role key in the application layer.
-- Runs as the DB owner → can access auth schema → no supabase_admin involvement.

create or replace function delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

-- Only authenticated users may call this
revoke all on function delete_own_account() from public;
grant execute on function delete_own_account() to authenticated;
