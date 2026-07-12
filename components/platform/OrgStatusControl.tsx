"use client";

import { useState, useTransition } from "react";
import { setOrgStatus } from "@/lib/platform/actions";
import Icon from "@/components/ui/Icon";
import type { OrgStatus } from "@/types/platform";

interface OrgStatusControlProps {
  orgId: string;
  orgName: string;
  status: OrgStatus;
}

export default function OrgStatusControl({ orgId, orgName, status }: OrgStatusControlProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [confirming, setConfirming] = useState(false);

  const suspended = status === "suspended";
  const nextStatus: OrgStatus = suspended ? "active" : "suspended";

  function apply() {
    setMessage(null);
    startTransition(async () => {
      const result = await setOrgStatus(orgId, nextStatus);
      if (result && "error" in result) setMessage({ type: "error", text: result.error });
      else if (result && "success" in result) setMessage({ type: "success", text: result.success });
      setConfirming(false);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={isPending}
          className={suspended ? "btn-primary" : "btn-destructive"}
        >
          <Icon name={suspended ? "check-circle" : "ban"} size={16} />
          {suspended ? "Reactivate organization" : "Suspend organization"}
        </button>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-700">
            {suspended ? (
              <>Reactivate <strong>{orgName}</strong>? Hiring operations will be re-enabled.</>
            ) : (
              <>Suspend <strong>{orgName}</strong>? Members can still log in, but job posting,
              candidate management, interviews, Gmail sync, and AI evaluation will be disabled.</>
            )}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={apply}
              disabled={isPending}
              className={suspended ? "btn-primary btn-sm" : "btn-destructive btn-sm"}
            >
              {isPending ? "Working…" : suspended ? "Yes, reactivate" : "Yes, suspend"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={isPending}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {message && (
        <p
          role="alert"
          className={`text-sm ${message.type === "error" ? "text-red-600" : "text-emerald-600"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
