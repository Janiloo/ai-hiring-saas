import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/ui/Icon";
import PlatformFilterBar from "@/components/platform/PlatformFilterBar";
import { getPlatformOrganizations } from "@/lib/platform/queries";
import { ORG_STATUS_META } from "@/types/platform";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function PlatformOrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const orgs = await getPlatformOrganizations(q, status);

  return (
    <div className="flex flex-col gap-6 p-8">
      <PageHeader
        title="Organizations"
        subtitle={`${orgs.length} organization${orgs.length !== 1 ? "s" : ""}${q || status ? " matching filters" : ""}`}
      />

      <PlatformFilterBar
        searchPlaceholder="Search by name or owner email…"
        filter={{
          paramName: "status",
          label: "Status",
          options: [
            { value: "active", label: "Active" },
            { value: "suspended", label: "Suspended" },
          ],
        }}
      />

      {orgs.length === 0 ? (
        <div className="card flex flex-col items-center justify-center border-dashed py-12 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <Icon name="building" size={20} />
          </span>
          <p className="mt-3 text-sm text-gray-500">No organizations found.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3">Organization</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3 text-center">Members</th>
                  <th className="px-4 py-3 text-center">Candidates</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orgs.map((o) => {
                  const meta = ORG_STATUS_META[o.status];
                  return (
                    <tr key={o.id} className="group transition hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">
                            {o.name[0]?.toUpperCase() ?? "?"}
                          </div>
                          <Link
                            href={`/platform/organizations/${o.id}`}
                            className="font-medium text-gray-900 hover:text-indigo-600"
                          >
                            {o.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{o.owner_email ?? "—"}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{o.member_count}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{o.candidate_count}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(o.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${meta.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/platform/organizations/${o.id}`}
                          className="inline-flex text-gray-300 transition group-hover:text-gray-500"
                          aria-label={`View ${o.name}`}
                        >
                          <Icon name="chevron-right" size={16} />
                        </Link>
                      </td>
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
