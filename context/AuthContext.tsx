"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import type { OrgRole } from "@/types/organization";

interface AuthContextValue {
  user:       User | null;
  orgRole:    OrgRole | null;
  orgId:      string | null;
  orgName:    string | null;
  orgLogoUrl: string | null;
  loading:    boolean;
  signOut:    () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user:       null,
  orgRole:    null,
  orgId:      null,
  orgName:    null,
  orgLogoUrl: null,
  loading:    true,
  signOut:    async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [orgRole, setOrgRole] = useState<OrgRole | null>(null);
  const [orgId,   setOrgId]   = useState<string | null>(null);
  const [orgName,    setOrgName]    = useState<string | null>(null);
  const [orgLogoUrl, setOrgLogoUrl] = useState<string | null>(null);
  const [loading,    setLoading]    = useState(true);
  const router   = useRouter();
  const supabase = createClient();

  async function loadOrgMembership(uid: string) {
    const { data } = await supabase
      .from("organization_members")
      .select("organization_id, role, organizations(name, logo_url)")
      .eq("user_id", uid)
      .limit(1)
      .maybeSingle();

    setOrgRole((data?.role as OrgRole) ?? null);
    setOrgId(data?.organization_id ?? null);

    const org = Array.isArray(data?.organizations)
      ? (data.organizations[0] as { name: string; logo_url: string | null } | undefined)
      : (data?.organizations as { name: string; logo_url: string | null } | null | undefined);
    setOrgName(org?.name ?? null);
    setOrgLogoUrl(org?.logo_url ?? null);
  }

  useEffect(() => {
    const url        = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const configured = url.startsWith("https://") && !url.includes("placeholder");

    if (!configured) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) await loadOrgMembership(user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          await loadOrgMembership(u.id);
        } else {
          setOrgRole(null);
          setOrgId(null);
          setOrgName(null);
          setOrgLogoUrl(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, orgRole, orgId, orgName, orgLogoUrl, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
