"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Icon, { type IconName } from "@/components/ui/Icon";

const NAV_ITEMS: { label: string; href: string; icon: IconName }[] = [
  { label: "Dashboard",     href: "/platform",               icon: "dashboard" },
  { label: "Organizations", href: "/platform/organizations", icon: "building" },
  { label: "Users",         href: "/platform/users",         icon: "users" },
  { label: "Analytics",     href: "/platform/analytics",     icon: "chart" },
  { label: "Audit Logs",    href: "/platform/audit",         icon: "activity" },
];

// Deliberately distinct chrome (dark slate, always) so the platform area never
// visually reads as a normal org workspace — even in light mode.
export default function PlatformSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? "Platform Admin";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-slate-800 bg-slate-950 text-slate-300">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-800 px-6">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500 text-white">
          <Icon name="shield" size={18} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">Autome</p>
          <p className="truncate text-[10px] font-medium uppercase tracking-wider text-indigo-400">
            Platform Admin
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/platform"
              ? pathname === "/platform"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-500/15 text-white"
                  : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
              }`}
            >
              <Icon
                name={item.icon}
                size={18}
                className={active ? "text-indigo-400" : "text-slate-500"}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Back to workspace */}
      <div className="px-3 pb-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-slate-800/70 hover:text-white"
        >
          <Icon name="arrow-right" size={14} className="rotate-180" />
          Back to workspace
        </Link>
      </div>

      {/* User footer */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-semibold text-indigo-300">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{displayName}</p>
            <p className="truncate text-[10px] font-medium text-slate-500">Super Admin</p>
          </div>
          <button
            onClick={signOut}
            title="Sign out"
            aria-label="Sign out"
            className="shrink-0 rounded-md p-1 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
