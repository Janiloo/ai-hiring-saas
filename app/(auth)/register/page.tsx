"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ensureOrganization } from "@/lib/actions/invitations";
import PasswordInput from "@/components/auth/PasswordInput";
import Icon from "@/components/ui/Icon";

function RegisterContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();

  const [fullName,        setFullName]        = useState("");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName,     setCompanyName]     = useState("");
  const [error,           setError]           = useState<string | null>(null);
  const [success,         setSuccess]         = useState(false);
  const [loading,         setLoading]         = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const next = searchParams.get("next");

    // Encode company name in the callback URL so the server can create the org
    // after email confirmation (localStorage is unavailable server-side).
    const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
    callbackUrl.searchParams.set("company_name", companyName.trim());
    if (next) callbackUrl.searchParams.set("next", next);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: callbackUrl.toString(),
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      // Email confirmation disabled — user is signed in immediately.
      await ensureOrganization(companyName.trim());
      router.push(next ?? "/dashboard");
      return;
    }

    // Email confirmation enabled — the callback will create the org on return.
    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="animate-card-in card card-pad text-center shadow-md">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Icon name="check-circle" size={26} />
        </div>
        <h2 className="mb-2 text-lg font-bold text-gray-900">Check your email</h2>
        <p className="text-sm text-gray-500">
          We sent a confirmation link to{" "}
          <span className="font-medium text-gray-700">{email}</span>.
          Click it to activate your account and set up your workspace.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-card-in card card-pad shadow-md">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Create your workspace</h1>
        <p className="mt-1 text-sm text-gray-500">
          Set up your company on Autome — you&apos;ll be the admin.
        </p>
      </div>

      <form onSubmit={handleRegister} className="flex flex-col gap-5">
        {/* Your details */}
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="fullName" className="label">Full name</label>
            <input
              id="fullName"
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Smith"
              className="input"
            />
          </div>

          <div>
            <label htmlFor="email" className="label">Work email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="input"
            />
          </div>

          <div>
            <label htmlFor="companyName" className="label">Company name</label>
            <input
              id="companyName"
              type="text"
              required
              autoComplete="organization"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Corp"
              className="input"
            />
          </div>
        </div>

        {/* Security */}
        <div className="flex flex-col gap-4 border-t border-gray-100 pt-5">
          <PasswordInput
            id="password"
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="Min. 6 characters"
            autoComplete="new-password"
            required
            minLength={6}
          />

          <PasswordInput
            id="confirmPassword"
            label="Confirm password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            required
            minLength={6}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-600"
          >
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary mt-1 w-full">
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Creating workspace…
            </>
          ) : (
            "Create workspace"
          )}
        </button>
      </form>

      <p className="mt-6 border-t border-gray-100 pt-5 text-center text-sm text-gray-500">
        Already have a workspace?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

// useSearchParams requires a Suspense boundary for static prerendering
export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}
