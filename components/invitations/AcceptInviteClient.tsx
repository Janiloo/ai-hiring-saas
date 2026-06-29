"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { acceptInvitation } from "@/lib/actions/invitations";
import { ORG_ROLE_META, type OrgRole } from "@/types/organization";
import { INVITATION_STATUS_META } from "@/types/invitation";
import type { InvitationPublic } from "@/types/invitation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

type ActionState = { error: string } | null;

interface Props {
  invitation: InvitationPublic;
  token:      string;
}

export default function AcceptInviteClient({ invitation, token }: Props) {
  const { user, loading } = useAuth();
  const supabase = createClient();

  const [state, acceptAction, isPending] = useActionState<ActionState, FormData>(
    acceptInvitation,
    null
  );

  // Registration form state
  const [fullName,         setFullName]         = useState("");
  const [password,         setPassword]         = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");
  const [regError,         setRegError]         = useState<string | null>(null);
  const [regLoading,       setRegLoading]       = useState(false);
  const [checkEmail,       setCheckEmail]       = useState(false);

  // Hidden accept form — submitted automatically once the user is authenticated
  const acceptFormRef = useRef<HTMLFormElement>(null);

  // Auto-submit the accept action whenever the authenticated user's email
  // matches the invitation. This covers two paths:
  //   1. New registration: signUp() returned a session immediately → auth
  //      context updated → this effect fires.
  //   2. Existing account: user clicked "Sign in to accept", logged in on the
  //      login page, then was redirected back here → this effect fires.
  useEffect(() => {
    if (
      !loading &&
      user &&
      user.email?.toLowerCase() === invitation.email.toLowerCase()
    ) {
      acceptFormRef.current?.requestSubmit();
    }
  }, [loading, user, invitation.email]);

  const roleMeta = ORG_ROLE_META[invitation.role as OrgRole];

  // ── Invitation no longer valid ────────────────────────────────────────────
  if (invitation.status !== "pending") {
    const { label, color } = INVITATION_STATUS_META[invitation.status];
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-400">
          ✕
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Invitation {label}</h1>
        <p className="text-sm text-gray-500">
          This invitation is no longer valid. Please ask your admin for a new one.
        </p>
        <span className={`mt-1 rounded-full border px-3 py-1 text-xs font-medium ${color}`}>
          {label}
        </span>
      </div>
    );
  }

  const isExpired = new Date(invitation.expires_at) < new Date();
  if (isExpired) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50 text-xl text-yellow-500">
          ⏱
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Invitation Expired</h1>
        <p className="text-sm text-gray-500">
          This invitation expired on{" "}
          {new Date(invitation.expires_at).toLocaleDateString("en-US", {
            month: "long",
            day:   "numeric",
            year:  "numeric",
          })}
          . Please ask your admin to send a new one.
        </p>
      </div>
    );
  }

  // ── Auth resolving ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  // ── Check-your-email screen ───────────────────────────────────────────────
  if (checkEmail) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">
          ✅
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Check your email</h1>
        <p className="text-sm text-gray-500">
          We sent a confirmation link to{" "}
          <span className="font-medium text-gray-700">{invitation.email}</span>.
          Click it to activate your account — you'll be brought back here
          automatically to complete joining{" "}
          <span className="font-medium text-gray-700">{invitation.org_name}</span>.
        </p>
      </div>
    );
  }

  // ── Not logged in — inline registration form ──────────────────────────────
  if (!user) {
    async function handleRegister(e: React.FormEvent) {
      e.preventDefault();
      setRegError(null);

      if (password !== confirmPassword) {
        setRegError("Passwords do not match.");
        return;
      }

      setRegLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email:    invitation.email,
        password,
        options: {
          data: { full_name: fullName },
          // If email confirmation is ON, bring the user back here after confirming
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            `/accept-invite?token=${token}`
          )}`,
        },
      });

      if (error) {
        setRegError(error.message);
        setRegLoading(false);
        return;
      }

      if (data.session) {
        // Email confirmation is OFF — user is signed in immediately.
        // The useEffect above will fire once AuthContext picks up the new user
        // and auto-submit the accept form. Keep regLoading=true so the spinner
        // stays visible until the server action completes and redirects.
        return;
      }

      // Email confirmation is ON — show the "check your email" screen.
      setRegLoading(false);
      setCheckEmail(true);
    }

    return (
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">You've been invited!</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create your account to join{" "}
            <span className="font-medium text-gray-800">{invitation.org_name}</span>{" "}
            as{" "}
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${roleMeta?.color ?? ""}`}
            >
              {roleMeta?.label ?? invitation.role}
            </span>
          </p>
        </div>

        {/* Registration form */}
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          {/* Full Name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Smith"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Email — pre-filled and locked to the invitation address */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              readOnly
              value={invitation.email}
              className="w-full cursor-not-allowed rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              Locked to your invitation address.
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {regError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
              {regError}
            </p>
          )}

          <button
            type="submit"
            disabled={regLoading}
            className="mt-1 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {regLoading
              ? "Creating account…"
              : `Create Account & Join ${invitation.org_name}`}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500">
          Already have an account?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(`/accept-invite?token=${token}`)}`}
            className="font-medium text-indigo-600 hover:underline"
          >
            Sign in to accept
          </Link>
        </p>

        {/* Hidden form auto-submitted by the useEffect once the user is signed in */}
        <form ref={acceptFormRef} action={acceptAction} style={{ display: "none" }}>
          <input type="hidden" name="token" value={token} />
        </form>
      </div>
    );
  }

  // ── Logged in — wrong email ───────────────────────────────────────────────
  if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center self-center rounded-full bg-yellow-50 text-xl text-yellow-500">
          ⚠
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Wrong Account</h1>
        <p className="text-sm text-gray-500">
          This invitation was sent to{" "}
          <span className="font-medium text-gray-800">{invitation.email}</span>,
          but you're signed in as{" "}
          <span className="font-medium text-gray-800">{user.email}</span>.
        </p>
        <p className="text-sm text-gray-500">
          Sign out and sign in with the correct email to accept.
        </p>
      </div>
    );
  }

  // ── Logged in, correct email — auto-completing ────────────────────────────
  // The useEffect at the top already triggered acceptFormRef.requestSubmit().
  // Show a loading state while the server action runs.
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      <p className="text-sm font-medium text-gray-700">
        {isPending || !state?.error
          ? `Completing your invitation to ${invitation.org_name}…`
          : ""}
      </p>

      {/* Error from the accept action */}
      {state?.error && (
        <div className="flex flex-col items-center gap-3">
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
            {state.error}
          </p>
          {/* Manual fallback in case auto-submit failed */}
          <form action={acceptAction}>
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {isPending ? "Joining…" : "Try Again"}
            </button>
          </form>
        </div>
      )}

      {/* Hidden form triggered by useEffect */}
      <form ref={acceptFormRef} action={acceptAction} style={{ display: "none" }}>
        <input type="hidden" name="token" value={token} />
      </form>
    </div>
  );
}
