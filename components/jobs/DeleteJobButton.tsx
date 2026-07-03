"use client";

import { useState, useTransition } from "react";
import { deleteJobPost } from "@/lib/actions/job-posts";

export default function DeleteJobButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteJobPost(id);
      if (result && "error" in result) setError(result.error);
    });
  }

  if (error) {
    return <span className="text-xs text-red-500">{error}</span>;
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {isPending ? "Deleting…" : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded px-2 py-1 text-xs font-medium text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
    >
      Delete
    </button>
  );
}
