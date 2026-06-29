"use client";

import { useTransition } from "react";
import { revokeInvitation } from "@/lib/actions/invitations";

interface Props {
  invitationId: string;
}

export default function RevokeInviteButton({ invitationId }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleRevoke() {
    if (!confirm("Revoke this invitation? The link will stop working immediately.")) return;
    startTransition(async () => {
      await revokeInvitation(invitationId);
    });
  }

  return (
    <button
      onClick={handleRevoke}
      disabled={isPending}
      className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
    >
      {isPending ? "Revoking…" : "Revoke"}
    </button>
  );
}
