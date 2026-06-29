import type { ActivityLog } from "@/types/activity-log";
import { ACTIVITY_TYPE_META } from "@/types/activity-log";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month:  "short",
    day:    "numeric",
    year:   "numeric",
    hour:   "numeric",
    minute: "2-digit",
  });
}

interface ActivityTimelineProps {
  activities: ActivityLog[];
}

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-base text-gray-400">
          ○
        </div>
        <p className="text-sm font-medium text-gray-500">No activity yet</p>
        <p className="mt-1 text-xs text-gray-400">
          Stage changes, interviews, and notes will appear here.
        </p>
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-0">
      {activities.map((activity, i) => {
        const isLast = i === activities.length - 1;
        const meta   = ACTIVITY_TYPE_META[activity.type];

        return (
          <li key={activity.id} className="relative flex gap-4 pb-5 last:pb-0">
            {/* Vertical connector */}
            {!isLast && (
              <div className="absolute left-3.5 top-7 bottom-0 w-px bg-gray-100" />
            )}

            {/* Type dot */}
            <div
              className={`relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ring-white text-xs ${meta.dotColor}`}
            >
              {meta.icon}
            </div>

            {/* Content */}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
              <p className="text-sm font-medium text-gray-900">{activity.title}</p>

              {activity.description && (
                <p className="text-xs text-gray-500">{activity.description}</p>
              )}

              <time className="text-xs text-gray-400">{formatTime(activity.created_at)}</time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
