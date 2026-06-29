"use client";

import { useActionState } from "react";
import { createInvitation } from "@/lib/actions/invitations";
import { ORG_ROLE_META, type OrgRole } from "@/types/organization";

type ActionState = { error: string } | null;

interface Props {
  organizationId: string;
}

const INVITE_ROLES: OrgRole[] = ["recruiter", "interviewer", "admin"];

export default function InviteForm({ organizationId }: Props) {
  const [state, action, isPending] = useActionState<ActionState, FormData>(
    createInvitation,
    null
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="organization_id" value={organizationId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Email */}
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label htmlFor="invite-email" className="text-xs font-medium text-gray-700">
            Email address
          </label>
          <input
            id="invite-email"
            type="email"
            name="email"
            required
            placeholder="colleague@company.com"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Role */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="invite-role" className="text-xs font-medium text-gray-700">
            Role
          </label>
          <select
            id="invite-role"
            name="role"
            defaultValue="recruiter"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {INVITE_ROLES.map((role) => (
              <option key={role} value={role}>
                {ORG_ROLE_META[role].label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400">
            Role permissions are enforced server-side.
          </p>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {isPending ? "Sending…" : "Send Invitation"}
        </button>
      </div>
    </form>
  );
}
