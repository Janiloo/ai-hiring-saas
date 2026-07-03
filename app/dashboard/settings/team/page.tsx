import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import InviteForm from "@/components/invitations/InviteForm";
import RevokeInviteButton from "@/components/invitations/RevokeInviteButton";
import { getUserOrganization, getOrgMembers, getInvitationsByOrg } from "@/lib/queries/invitations";
import { ensureOrganization } from "@/lib/actions/invitations";
import { ORG_ROLE_META, type OrgRole, type Organization, type OrgMember, type OrgMemberWithUser } from "@/types/organization";
import { INVITATION_STATUS_META } from "@/types/invitation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = { title: "Team — Settings" };

export default async function TeamSettingsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let org: Organization;
  let member: OrgMember;

  const existing = await getUserOrganization();

  if (existing) {
    org    = existing.org;
    member = existing.member;
  } else {
    // First visit — create org + admin membership
    const orgId = await ensureOrganization("My Organization");

    if (!orgId) {
      // Creation failed — show error instead of redirect loop
      return (
        <div className="flex flex-col gap-4 p-8 max-w-3xl">
          <p className="text-sm font-medium text-red-600">
            Could not create your organization. Please refresh the page and try again.
          </p>
        </div>
      );
    }

    // Try to fetch the newly-created org
    const fresh = await getUserOrganization();

    if (fresh) {
      org    = fresh.org;
      member = fresh.member;
    } else {
      // Org was inserted (orgId returned) but RLS blocked the immediate re-read.
      // Build the minimum data we need from what we already know so the page
      // renders correctly on this first load. The next navigation will use the
      // normal path.
      org = {
        id:         orgId,
        name:       "My Organization",
        created_by: user.id,
        created_at: new Date().toISOString(),
      };
      member = {
        id:              "",
        user_id:         user.id,
        organization_id: orgId,
        role:            "admin",
        created_at:      new Date().toISOString(),
      };
    }
  }

  const isAdmin = member.role === "admin";

  const [members, invitations] = await Promise.all([
    getOrgMembers(org.id) as Promise<OrgMemberWithUser[]>,
    isAdmin ? getInvitationsByOrg(org.id) : Promise.resolve([]),
  ]);

  const pendingInvitations = invitations.filter((i) => i.status === "pending");
  const pastInvitations    = invitations.filter((i) => i.status !== "pending");

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 max-w-3xl">
      <PageHeader
        title="Team Management"
        subtitle={`${org.name} · ${members.length} member${members.length !== 1 ? "s" : ""}`}
      />

      {/* ── Invite new member (admin only) ─────────────────────────────── */}
      {isAdmin && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-gray-900">Invite Team Member</h2>
            <p className="mt-0.5 text-xs text-gray-400">
              An invitation email will be sent to the recipient with a secure link.
            </p>
          </div>
          <div className="p-5">
            <InviteForm organizationId={org.id} />
          </div>
        </div>
      )}

      {/* ── Current members ──────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-gray-900">Members</h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {members.length === 0 ? (
            <li className="px-5 py-4 text-sm text-gray-400">
              No members loaded yet — refresh the page.
            </li>
          ) : (
            members.map((m) => {
              const roleMeta = ORG_ROLE_META[m.role as OrgRole];
              const isMe     = m.user_id === user.id;
              return (
                <li key={m.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                      {m.full_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {isMe ? `${m.full_name} (You)` : m.full_name}
                      </p>
                      <p className="truncate text-xs text-gray-400">{m.email}</p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleMeta?.color ?? ""}`}
                  >
                    {roleMeta?.label ?? m.role}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* ── Pending invitations (admin only) ─────────────────────────────── */}
      {isAdmin && pendingInvitations.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-gray-900">
              Pending Invitations
              <span className="ml-1.5 rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700">
                {pendingInvitations.length}
              </span>
            </h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {pendingInvitations.map((inv) => {
              const roleMeta = ORG_ROLE_META[inv.role as OrgRole];
              return (
                <li key={inv.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{inv.email}</p>
                    <p className="text-xs text-gray-400">
                      Expires{" "}
                      {new Date(inv.expires_at).toLocaleDateString("en-US", {
                        month: "short",
                        day:   "numeric",
                        year:  "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleMeta?.color ?? ""}`}>
                      {roleMeta?.label ?? inv.role}
                    </span>
                    <RevokeInviteButton invitationId={inv.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── Past invitations ─────────────────────────────────────────────── */}
      {isAdmin && pastInvitations.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-gray-900 text-gray-400">
              Invitation History
            </h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {pastInvitations.map((inv) => {
              const { label, color } = INVITATION_STATUS_META[inv.status];
              const roleMeta = ORG_ROLE_META[inv.role as OrgRole];
              return (
                <li key={inv.id} className="flex items-center justify-between gap-4 px-5 py-3.5 opacity-60">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-gray-700">{inv.email}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-gray-400">{roleMeta?.label ?? inv.role}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${color}`}>
                      {label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {!isAdmin && (
        <p className="text-sm text-gray-400">
          Only admins can invite or manage team members.
        </p>
      )}
    </div>
  );
}
