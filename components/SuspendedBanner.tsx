import Icon from "@/components/ui/Icon";

// Shown across the workspace when the user's organization is suspended. Reads
// stay enabled (users can still log in and view data); this explains why write
// actions are disabled. Suspension itself is enforced server-side.
export default function SuspendedBanner({ orgName }: { orgName: string | null }) {
  return (
    <div className="flex items-start gap-3 border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">
      <Icon name="ban" size={18} className="mt-0.5 shrink-0" />
      <p>
        <strong>{orgName ?? "This organization"}</strong> is currently suspended. Hiring
        operations — job posting, candidate management, interviews, Gmail sync, and AI evaluation —
        are disabled. You can still view existing data. Contact your platform administrator to
        restore access.
      </p>
    </div>
  );
}
