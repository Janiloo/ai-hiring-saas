"use client";

import { useTransition } from "react";
import { updateInterviewStatus } from "@/lib/actions/interviews";

export default function CancelInterviewButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await updateInterviewStatus(id, "cancelled");
        })
      }
      className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-1.5 text-sm font-medium text-yellow-700 transition hover:bg-yellow-100 disabled:opacity-50"
    >
      {pending ? "Cancelling…" : "Cancel Interview"}
    </button>
  );
}
