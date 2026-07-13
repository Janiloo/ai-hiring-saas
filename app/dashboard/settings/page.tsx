import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getUserOrganization } from "@/lib/queries/invitations";
import PageHeader from "@/components/PageHeader";
import SectionHeader from "@/components/SectionHeader";
import DeleteAccountButton from "@/components/settings/DeleteAccountButton";
import RecruitmentSettings from "@/components/settings/RecruitmentSettings";
import OrgProfileSettings from "@/components/settings/OrgProfileSettings";
import { ORG_ROLE_META, type OrgRole } from "@/types/organization";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const supabase    = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? "User";
  const email       = user?.email ?? "";
  const initials    = displayName
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const orgResult = await getUserOrganization();
  const orgRole   = (orgResult?.member.role ?? null) as OrgRole | null;
  const isAdmin   = orgRole === "admin";

  // Org details (logo, recruitment settings)
  let orgLogoUrl: string | null = null;
  let recruitment: { recruitment_email: string | null; gmail_connected_email: string | null } | null = null;
  if (orgResult) {
    const { data } = await supabase
      .from("organizations")
      .select("logo_url, recruitment_email, gmail_connected_email")
      .eq("id", orgResult.org.id)
      .maybeSingle();
    orgLogoUrl = data?.logo_url ?? null;
    if (isAdmin) {
      recruitment = {
        recruitment_email: data?.recruitment_email ?? null,
        gmail_connected_email: data?.gmail_connected_email ?? null,
      };
    }
  }
  const roleMeta  = orgRole ? ORG_ROLE_META[orgRole] : null;

  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title="Settings"
        subtitle="Manage your account, team, and workspace preferences."
      />

      {/* Profile */}
      <section>
        <SectionHeader title="Profile" />
        <div className="card card-pad">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{displayName}</p>
              <p className="text-xs text-gray-500">{email}</p>
              {roleMeta && (
                <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${roleMeta.color}`}>
                  {roleMeta.label}
                </span>
              )}
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { label: "Full Name", value: displayName },
              { label: "Email",     value: email },
              { label: "Role",      value: roleMeta?.label ?? "—" },
              { label: "Organization", value: orgResult?.org.name ?? "—" },
            ].map((f) => (
              <div key={f.label}>
                <label className="mb-1 block text-xs font-medium text-gray-500">{f.label}</label>
                <input
                  type="text"
                  readOnly
                  defaultValue={f.value}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Organization */}
      {orgResult && (
        <section>
          <SectionHeader title="Organization" />
          <OrgProfileSettings
            orgName={orgResult.org.name}
            logoUrl={orgLogoUrl}
            isAdmin={isAdmin}
          />
        </section>
      )}

      {/* Notifications */}
      <section>
        <SectionHeader title="Notifications" />
        <div className="card card-pad">
          <div className="flex flex-col gap-4">
            {[
              { label: "New candidate applications",  desc: "Get notified when someone applies to an open role" },
              { label: "Interview reminders",         desc: "Receive reminders 1 hour before scheduled interviews" },
              { label: "AI scoring complete",         desc: "Alert when resume scoring finishes processing" },
              { label: "Weekly digest",               desc: "Summary of hiring activity every Monday" },
            ].map((n) => (
              <div key={n.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{n.label}</p>
                  <p className="text-xs text-gray-500">{n.desc}</p>
                </div>
                <div className="flex h-5 w-9 cursor-pointer items-center rounded-full bg-indigo-600 px-0.5">
                  <div className="h-4 w-4 translate-x-4 rounded-full bg-white shadow transition" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recruitment — admin only */}
      {isAdmin && recruitment && (
        <section>
          <SectionHeader title="Recruitment" />
          <Suspense>
            <RecruitmentSettings
              recruitmentEmail={recruitment.recruitment_email}
              gmailConnectedEmail={recruitment.gmail_connected_email}
            />
          </Suspense>
        </section>
      )}

      {/* Team Management — admin only */}
      {isAdmin && (
        <section>
          <SectionHeader title="Team" />
          <div className="card card-pad">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Team Members &amp; Invitations</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Invite colleagues and manage roles for your organization.
                </p>
              </div>
              <Link
                href="/dashboard/settings/team"
                className="btn-primary"
              >
                Manage Team
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Danger Zone */}
      <section>
        <SectionHeader title="Danger Zone" />
        <div className="card card-pad border-red-200">
          <p className="text-sm text-gray-500">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <DeleteAccountButton />
        </div>
      </section>
    </div>
  );
}
