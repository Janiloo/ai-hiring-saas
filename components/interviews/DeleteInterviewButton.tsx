"use client";

import { useActionState, useTransition } from "react";
import { deleteInterview } from "@/lib/actions/interviews";

type ActionState = { error: string } | null;

export default function DeleteInterviewButton({ id }: { id: string }) {
  const [confirmed, setConfirmed] = useTransition();
  const [state, formAction] = useActionState<ActionState, FormData>(deleteInterview, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      {state?.error && <p className="mb-1 text-xs text-red-600">{state.error}</p>}
      <button
        type="submit"
        onClick={(e) => {
          if (!window.confirm("Delete this interview? This cannot be undone.")) e.preventDefault();
        }}
        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100"
      >
        Delete
      </button>
    </form>
  );
}
