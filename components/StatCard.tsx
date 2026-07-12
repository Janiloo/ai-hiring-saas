import Icon, { type IconName } from "@/components/ui/Icon";

interface StatCardProps {
  label: string;
  value: string | number;
  /** Named line icon (preferred) or an emoji/string (legacy fallback). */
  icon?: IconName | string;
  /** Muted descriptor line, e.g. "Active listings". */
  hint?: string;
  /** Legacy alias for `hint`. */
  change?: string;
  /** Legacy prop, retained for compatibility. No longer drives color. */
  positive?: boolean;
}

const KNOWN_ICONS: IconName[] = [
  "users", "briefcase", "calendar", "check-circle",
  "chevron-right", "user-plus", "calendar-plus", "arrow-right",
  "shield", "building", "activity", "sparkles", "mail", "ban",
  "dashboard", "pipeline", "chart", "settings",
];

function isIconName(v: string): v is IconName {
  return (KNOWN_ICONS as string[]).includes(v);
}

export default function StatCard({ label, value, icon, hint, change }: StatCardProps) {
  const descriptor = hint ?? change;

  return (
    <div className="card card-pad transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p
            className="mt-2 text-3xl font-bold tracking-tight text-gray-900"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            {value}
          </p>
        </div>
        {icon && (
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"
            style={{ boxShadow: "inset 0 -2px 0 rgb(0 0 0 / 0.06)" }}
          >
            {typeof icon === "string" && isIconName(icon)
              ? <Icon name={icon} size={20} />
              : <span className="text-lg leading-none">{icon}</span>}
          </span>
        )}
      </div>
      {descriptor && (
        <p className="mt-3 text-xs font-medium text-gray-400">{descriptor}</p>
      )}
    </div>
  );
}
