import PageHeader from "@/components/PageHeader";
import Icon from "@/components/ui/Icon";
import { getPlatformAuditLogs } from "@/lib/platform/queries";
import { AUDIT_ACTION_META } from "@/types/platform";

export const dynamic = "force-dynamic";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function PlatformAuditPage() {
  const logs = await getPlatformAuditLogs();

  return (
    <div className="flex flex-col gap-6 p-8">
      <PageHeader
        title="Audit Logs"
        subtitle="Platform-level actions: suspensions, reactivations, and administrative changes."
      />

      {logs.length === 0 ? (
        <div className="card flex flex-col items-center justify-center border-dashed py-12 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <Icon name="activity" size={20} />
          </span>
          <p className="mt-3 text-sm text-gray-500">No platform actions recorded yet.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {logs.map((log) => {
              const meta = AUDIT_ACTION_META[log.action] ?? {
                label: log.action,
                color: "text-gray-700 bg-gray-50 border-gray-200",
              };
              return (
                <li key={log.id} className="flex items-start justify-between gap-4 px-5 py-3.5">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                      <Icon name="activity" size={15} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${meta.color}`}>
                          {meta.label}
                        </span>
                        {log.target_label && (
                          <span className="truncate text-sm font-medium text-gray-900">
                            {log.target_label}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        by {log.actor_email ?? "Unknown"}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-xs text-gray-400">
                    {formatDateTime(log.created_at)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
