"use client";

import { useActionState, useState } from "react";
import { deleteAccount } from "@/lib/actions/account";

type ActionState = { error: string } | null;

export default function DeleteAccountButton() {
  const [confirming, setConfirming]         = useState(false);
  const [state, action, isPending] = useActionState<ActionState, FormData>(
    deleteAccount,
    null
  );

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
      >
        Delete Account
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-semibold text-red-800">
        Are you sure you want to delete your account?
      </p>
      <p className="mt-1 text-xs text-red-600">
        This permanently deletes your account and all data you created — including
        job posts, candidates, and interviews. This action cannot be undone.
      </p>

      {state?.error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs text-red-700">
          {state.error}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <form action={action}>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {isPending ? "Deleting…" : "Yes, delete my account"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
