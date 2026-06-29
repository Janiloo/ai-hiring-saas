"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { CandidateWithJob } from "@/types/candidate";
import { STAGE_ORDER, STAGE_META } from "@/types/candidate";
import type { ActionState } from "@/lib/actions/candidates";

interface JobOption {
  id: string;
  title: string;
  department: string;
}

interface CandidateFormProps {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  initial?: CandidateWithJob;
  jobs: JobOption[];
  cancelHref: string;
}

export default function CandidateForm({
  action,
  initial,
  jobs,
  cancelHref,
}: CandidateFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);

  const v = (field: keyof CandidateWithJob) =>
    initial ? String(initial[field] ?? "") : "";

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Full Name */}
        <div className="sm:col-span-2">
          <label className="label">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            name="full_name"
            required
            defaultValue={v("full_name")}
            placeholder="e.g. Sarah Johnson"
            className="input"
          />
        </div>

        {/* Email */}
        <div>
          <label className="label">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            name="email"
            type="email"
            required
            defaultValue={v("email")}
            placeholder="candidate@email.com"
            className="input"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="label">Phone</label>
          <input
            name="phone"
            type="tel"
            defaultValue={v("phone")}
            placeholder="+1 (555) 000-0000"
            className="input"
          />
        </div>

        {/* Resume URL */}
        <div className="sm:col-span-2">
          <label className="label">Resume URL</label>
          <input
            name="resume_url"
            type="url"
            defaultValue={v("resume_url")}
            placeholder="https://drive.google.com/…"
            className="input"
          />
        </div>

        {/* Assign to Job */}
        <div>
          <label className="label">Assign to Job Post</label>
          <select
            name="job_post_id"
            defaultValue={initial?.job_post_id ?? ""}
            className="input"
          >
            <option value="">— Unassigned —</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.department})
              </option>
            ))}
          </select>
        </div>

        {/* Stage */}
        <div>
          <label className="label">
            Stage <span className="text-red-500">*</span>
          </label>
          <select
            name="stage"
            defaultValue={v("stage") || "applied"}
            className="input"
          >
            {STAGE_ORDER.map((s) => (
              <option key={s} value={s}>
                {STAGE_META[s].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="label">Notes</label>
        <textarea
          name="notes"
          rows={4}
          defaultValue={v("notes")}
          placeholder="Add any notes about this candidate…"
          className="input resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {isPending ? "Saving…" : initial ? "Save changes" : "Add candidate"}
        </button>
        <Link
          href={cancelHref}
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
