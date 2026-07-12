"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import PasswordInput from "@/components/auth/PasswordInput";

function LoginContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();

  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const next = searchParams.get("next");
    router.push(next ?? "/dashboard");
    router.refresh();
  }

  return (
    <div className="animate-card-in card card-pad shadow-md">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Welcome back</h1>
        <p className="mt-1 text-sm text-gray-500">Sign in to your HyperFlow account</p>
      </div>

      {/* Tab order is driven by DOM order (email → password → Sign in → Forgot);
          `order-*` only rearranges the visual layout so Forgot sits below the
          password field without stealing focus after the email input. */}
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div className="order-1">
          <label htmlFor="email" className="label">Email</label>
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

        <div className="order-2">
          <PasswordInput
            id="password"
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary order-5 mt-1 w-full"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </button>

        <div className="order-3 -mt-2 flex justify-end">
          <Link
            href="/forgot-password"
            className="rounded text-xs font-medium text-gray-500 transition-colors hover:text-indigo-600"
          >
            Forgot password?
          </Link>
        </div>

        {error && (
          <p
            role="alert"
            className="order-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-600"
          >
            {error}
          </p>
        )}
      </form>

      <p className="mt-6 border-t border-gray-100 pt-5 text-center text-sm text-gray-500">
        Don&apos;t have a workspace?{" "}
        <Link href="/register" className="font-medium text-indigo-600 hover:underline">
          Create workspace
        </Link>
      </p>
    </div>
  );
}

// useSearchParams requires a Suspense boundary for static prerendering
export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
