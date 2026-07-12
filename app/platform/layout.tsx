import type { Metadata } from "next";
import PlatformSidebar from "@/components/platform/PlatformSidebar";
import { requirePlatformAdminPage } from "@/lib/platform/auth";

export const metadata: Metadata = {
  title: "Platform Admin — Autome",
};

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authoritative, DB-backed guard. Non-admins are redirected to /dashboard.
  // (proxy.ts already performs a coarse app_metadata check before this runs.)
  await requirePlatformAdminPage();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <PlatformSidebar />
      <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
    </div>
  );
}
