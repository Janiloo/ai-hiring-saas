"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { CandidateWithJob } from "@/types/candidate";
import { STAGE_META } from "@/types/candidate";
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

        {/* Resume (PDF) */}
        <div className="sm:col-span-2">
          <label className="label">Resume (PDF)</label>
          <input
            name="resume_file"
            type="file"
            accept=".pdf,application/pdf"
            className="input file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-600 hover:file:bg-indigo-100"
          />
          {initial?.resume_url && (
            <p className="mt-1 text-xs text-gray-500">
              Current resume:{" "}
              <a
                href={initial.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                View PDF ↗
              </a>
              {" "}— upload a new file to replace it.
            </p>
          )}
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

        {/* Stage — read-only: pipeline changes go through the stage selector /
            pipeline board, which enforce the state machine and role rules. */}
        <div>
          <label className="label">Stage</label>
          <input
            type="text"
            readOnly
            value={initial ? (STAGE_META[initial.stage]?.label ?? initial.stage) : "Applied"}
            className="input cursor-not-allowed bg-gray-50 text-gray-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            {initial
              ? "Change the stage from the candidate page or pipeline board."
              : "New candidates always start in Applied."}
          </p>
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
