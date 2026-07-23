"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { ORG_ROLE_META, type OrgRole } from "@/types/organization";
import Icon, { type IconName } from "@/components/ui/Icon";

const NAV_ITEMS: {
  label: string;
  href: string;
  icon: IconName;
  roles: readonly OrgRole[];
}[] = [
  { label: "Dashboard",  href: "/dashboard",            icon: "dashboard", roles: ["admin", "recruiter", "interviewer"] },
  { label: "Candidates", href: "/dashboard/candidates", icon: "users",     roles: ["admin", "recruiter", "interviewer"] },
  { label: "Pipeline",   href: "/dashboard/pipeline",   icon: "pipeline",  roles: ["admin", "recruiter", "interviewer"] },
  { label: "Job Posts",  href: "/dashboard/jobs",       icon: "briefcase", roles: ["admin", "recruiter", "interviewer"] },
  { label: "Interviews", href: "/dashboard/interviews", icon: "calendar",  roles: ["admin", "recruiter", "interviewer"] },
  { label: "AI Recommendations", href: "/dashboard/ai-recommendations", icon: "sparkles", roles: ["admin", "recruiter"] },
  { label: "Reports",    href: "/dashboard/reports",    icon: "chart",     roles: ["admin", "recruiter"] },
  { label: "Settings",   href: "/dashboard/settings",   icon: "settings",  roles: ["admin", "recruiter", "interviewer"] },
];

function OrgMark({ orgLogoUrl, orgName, sizeClass = "h-8 w-8" }: { orgLogoUrl: string | null; orgName: string | null; sizeClass?: string }) {
  return orgLogoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={orgLogoUrl}
      alt={orgName ?? "Organization"}
      className={`${sizeClass} shrink-0 rounded-lg object-cover`}
    />
  ) : (
    <div className={`${sizeClass} flex shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white`}>
      {orgName ? orgName[0].toUpperCase() : "M"}
    </div>
  );
}

export default function Sidebar() {
  const pathname              = usePathname();
  const { user, orgRole, orgName, orgLogoUrl, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer whenever the route changes (a nav item was tapped).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open on mobile.
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? "User";
  const initials    = displayName
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const visibleItems = orgRole
    ? NAV_ITEMS.filter((item) => (item.roles as readonly string[]).includes(orgRole))
    : NAV_ITEMS; // show all while loading

  const roleMeta = orgRole ? ORG_ROLE_META[orgRole as OrgRole] : null;

  // Platform admins (SUPER_ADMIN) get an entry point to the platform area. The
  // claim is set only by the service role, so it can't be spoofed client-side;
  // /platform re-verifies against the platform_admins table server-side.
  const isPlatformAdmin = user?.app_metadata?.platform_admin === true;

  return (
    <>
      {/* ── Mobile top bar (hidden ≥ md) ─────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-200 bg-surface px-4 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
        >
          <Icon name="menu" size={20} />
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <OrgMark orgLogoUrl={orgLogoUrl} orgName={orgName} sizeClass="h-7 w-7" />
          <span className="truncate text-sm font-semibold text-gray-900">{orgName ?? "Makes"}</span>
        </div>
      </header>

      {/* ── Backdrop (mobile, when open) ─────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar / drawer ─────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-gray-200 bg-white
          transition-transform duration-200 ease-out
          md:static md:z-auto md:w-60 md:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo + mobile close */}
        <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
          <OrgMark orgLogoUrl={orgLogoUrl} orgName={orgName} />
          <span className="truncate text-base font-semibold text-gray-900">
            {orgName ?? "Makes"}
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 md:hidden"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {visibleItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon
                  name={item.icon}
                  size={18}
                  className={active ? "text-indigo-600" : "text-gray-400"}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Platform admin entry point (SUPER_ADMIN only) */}
        {isPlatformAdmin && (
          <div className="px-3 pb-2">
            <Link
              href="/platform"
              className="flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
            >
              <Icon name="shield" size={18} className="text-indigo-600" />
              Platform Admin
            </Link>
          </div>
        )}

        {/* User footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{displayName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {roleMeta && (
                  <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none ${roleMeta.color}`}>
                    {roleMeta.label}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={toggle}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="shrink-0 rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
            </button>
            <button
              onClick={signOut}
              title="Sign out"
              aria-label="Sign out"
              className="shrink-0 rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
