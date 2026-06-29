import type { ReactNode } from "react";

export default function AcceptInviteLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold tracking-tight text-gray-900">
            Hire<span className="text-indigo-600">AI</span>
          </span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white px-8 py-8 shadow-sm">
          {children}
        </div>
      </div>
    </main>
  );
}
