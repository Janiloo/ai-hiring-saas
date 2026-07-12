import { cookies } from "next/headers";
import Sidebar from "@/components/Sidebar";
import SuspendedBanner from "@/components/SuspendedBanner";
import { createClient } from "@/utils/supabase/server";

async function getOrgSuspension(): Promise<{ suspended: boolean; name: string | null }> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data } = await supabase
    .from("organization_members")
    .select("organizations(name, status)")
    .limit(1)
    .maybeSingle();

  const org = Array.isArray(data?.organizations)
    ? (data.organizations[0] as { name: string; status: string } | undefined)
    : (data?.organizations as { name: string; status: string } | null | undefined);

  return { suspended: org?.status === "suspended", name: org?.name ?? null };
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { suspended, name } = await getOrgSuspension();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-y-auto">
        {suspended && <SuspendedBanner orgName={name} />}
        {children}
      </main>
    </div>
  );
}
