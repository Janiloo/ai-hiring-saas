"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Periodically re-fetches the current route's server data so lists stay fresh
// without manual reloads (new candidates from background ingestion, AI badge
// transitions). router.refresh() re-renders server components in place — no
// full page reload, scroll position and form state are preserved.
export default function AutoRefresh({ intervalMs = 60_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      // Skip refreshes while the tab is hidden — no point re-fetching data
      // nobody is looking at, and it burns serverless invocations.
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
