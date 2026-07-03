"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type State = "idle" | "loading" | "success" | "error";

function ForgotPasswordContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>(
    searchParams.get("error") === "link_expired" ? "error" : "idle"
  );
  const [errorMsg, setErrorMsg] = useState(
    searchParams.get("error") === "link_expired"
      ? "Your reset link has expired. Request a new one below."
      : ""
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setErrorMsg(error.message);
      setState("error");
      return;
    }

    setState("success");
  }

  if (state === "success") {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-2xl">
          📬
        </div>
        <h2 className="mb-2 text-lg font-bold text-gray-900">Check your inbox</h2>
        <p className="text-sm text-gray-500">
          We sent a password reset link to{" "}
          <span className="font-medium text-gray-700">{email}</span>.
          It expires in 1 hour.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:underline"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="mb-1 text-xl font-bold text-gray-900">Reset your password</h1>
      <p className="mb-6 text-sm text-gray-500">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">
            Email address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {(state === "error") && errorMsg && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={state === "loading"}
          className="mt-1 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {state === "loading" ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-gray-500">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}

// useSearchParams requires a Suspense boundary for static prerendering
export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordContent />
    </Suspense>
  );
}
