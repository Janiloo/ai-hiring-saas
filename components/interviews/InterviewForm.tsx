"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { InterviewWithRelations, InterviewType, InterviewStatus } from "@/types/interview";
import { INTERVIEW_TYPE_LABELS } from "@/types/interview";

type ActionState = { error: string } | null;

interface CandidateOption { id: string; full_name: string; email: string }
interface JobOption { id: string; title: string }

interface InterviewFormProps {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  initial?: InterviewWithRelations;
  candidates: CandidateOption[];
  jobs: JobOption[];
  cancelHref: string;
}

const INTERVIEW_TYPES: InterviewType[] = ["phone_screen", "video_call", "technical", "onsite", "panel", "final_round"];
const INTERVIEW_STATUSES: InterviewStatus[] = ["scheduled", "completed", "cancelled"];

function toDatetimeLocal(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function InterviewForm({ action, initial, candidates, jobs, cancelHref }: InterviewFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Candidate */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="candidate_id" className="label">Candidate *</label>
          <select
            id="candidate_id"
            name="candidate_id"
            required
            defaultValue={initial?.candidate_id ?? ""}
            className="input"
          >
            <option value="">Select candidate…</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
            ))}
          </select>
        </div>

        {/* Job Post */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="job_post_id" className="label">Job Post</label>
          <select
            id="job_post_id"
            name="job_post_id"
            defaultValue={initial?.job_post_id ?? ""}
            className="input"
          >
            <option value="">None</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </div>

        {/* Interviewer */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="interviewer" className="label">Interviewer *</label>
          <input
            id="interviewer"
            name="interviewer"
            type="text"
            required
            defaultValue={initial?.interviewer ?? ""}
            placeholder="e.g. Jane Smith"
            className="input"
          />
        </div>

        {/* Interview Type */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="interview_type" className="label">Interview Type *</label>
          <select
            id="interview_type"
            name="interview_type"
            required
            defaultValue={initial?.interview_type ?? ""}
            className="input"
          >
            <option value="">Select type…</option>
            {INTERVIEW_TYPES.map((t) => (
              <option key={t} value={t}>{INTERVIEW_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>

        {/* Scheduled At */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="scheduled_at" className="label">Scheduled At *</label>
          <input
            id="scheduled_at"
            name="scheduled_at"
            type="datetime-local"
            required
            defaultValue={initial ? toDatetimeLocal(initial.scheduled_at) : ""}
            className="input"
          />
        </div>

        {/* Status (only on edit) */}
        {initial && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="status" className="label">Status</label>
            <select
              id="status"
              name="status"
              defaultValue={initial.status}
              className="input"
            >
              {INTERVIEW_STATUSES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        )}

        {/* Meeting Link */}
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="meeting_link" className="label">Meeting Link</label>
          <input
            id="meeting_link"
            name="meeting_link"
            type="url"
            defaultValue={initial?.meeting_link ?? ""}
            placeholder="https://meet.google.com/…"
            className="input"
          />
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="notes" className="label">Notes</label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={initial?.notes ?? ""}
            placeholder="Interview notes, topics to cover, preparation notes…"
            className="input resize-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {isPending ? "Saving…" : initial ? "Save Changes" : "Schedule Interview"}
        </button>
        <Link
          href={cancelHref}
          className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
