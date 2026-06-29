-- ============================================================
-- Grant EXECUTE on all SECURITY DEFINER functions to both roles.
-- Supabase no longer auto-grants this — without it the RPC
-- returns empty data silently (no error), causing "Not Found".
-- ============================================================

grant execute on function get_invitation_by_token(text)   to anon, authenticated;
grant execute on function get_user_org_role(uuid, uuid)   to anon, authenticated;
grant execute on function org_has_members(uuid)            to anon, authenticated;

-- ============================================================
-- Also grant table-level SELECT so PostgREST can resolve the
-- function's return type for anon callers.
-- These do NOT bypass RLS — row visibility is still controlled
-- by the existing policies.
-- ============================================================

grant select on organizations        to anon, authenticated;
grant select on organization_members to anon, authenticated;
grant select on invitations          to anon, authenticated;
