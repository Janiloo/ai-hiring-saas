import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/ui/Icon";
import PlatformFilterBar from "@/components/platform/PlatformFilterBar";
import { getPlatformUsers } from "@/lib/platform/queries";
import { ORG_ROLE_META, type OrgRole } from "@/types/organization";
import { ORG_STATUS_META } from "@/types/platform";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function PlatformUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const { q, role } = await searchParams;
  const users = await getPlatformUsers(q, role);

  return (
    <div className="flex flex-col gap-6 p-8">
      <PageHeader
        title="Users"
        subtitle={`${users.length} member${users.length !== 1 ? "s" : ""} across all organizations`}
      />

      <PlatformFilterBar
        searchPlaceholder="Search by name, email, or organization…"
        filter={{
          paramName: "role",
          label: "Role",
          options: [
            { value: "admin", label: "Admin" },
            { value: "recruiter", label: "Recruiter" },
            { value: "interviewer", label: "Interviewer" },
          ],
        }}
      />

      {users.length === 0 ? (
        <div className="card flex flex-col items-center justify-center border-dashed py-12 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <Icon name="users" size={20} />
          </span>
          <p className="mt-3 text-sm text-gray-500">No users found.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Organization</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Org status</th>
                  <th className="px-4 py-3">Last sign-in</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => {
                  const roleMeta = ORG_ROLE_META[u.role as OrgRole];
                  const statusMeta = ORG_STATUS_META[u.org_status];
                  return (
                    <tr key={`${u.user_id}-${u.organization_id}`} className="transition hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                            {u.full_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-900">{u.full_name}</p>
                            <p className="truncate text-xs text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/platform/organizations/${u.organization_id}`}
                          className="text-gray-700 hover:text-indigo-600"
                        >
                          {u.organization_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${roleMeta?.color ?? ""}`}>
                          {roleMeta?.label ?? u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${u.org_status === "suspended" ? "text-red-600" : "text-gray-500"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(u.last_sign_in_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
