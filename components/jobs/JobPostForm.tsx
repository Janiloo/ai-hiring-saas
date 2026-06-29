"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { JobPost } from "@/types/job-post";
import { EXPERIENCE_OPTIONS } from "@/types/job-post";
import type { ActionState } from "@/lib/actions/job-posts";

interface JobPostFormProps {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  initial?: JobPost;
}

export default function JobPostForm({ action, initial }: JobPostFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);

  const v = (field: keyof JobPost) => (initial ? String(initial[field] ?? "") : "");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">
          {state.error}
        </div>
      )}

      {/* Row 1 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Job Title <span className="text-red-500">*</span></label>
          <input name="title" required defaultValue={v("title")}
            placeholder="e.g. Senior Frontend Engineer"
            className="input" />
        </div>

        <div>
          <label className="label">Department <span className="text-red-500">*</span></label>
          <input name="department" required defaultValue={v("department")}
            placeholder="e.g. Engineering"
            className="input" />
        </div>

        <div>
          <label className="label">Location <span className="text-red-500">*</span></label>
          <input name="location" required defaultValue={v("location")}
            placeholder="e.g. Remote / New York, NY"
            className="input" />
        </div>

        <div>
          <label className="label">Employment Type <span className="text-red-500">*</span></label>
          <select name="employment_type" required defaultValue={v("employment_type") || "full-time"} className="input">
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </div>

        <div>
          <label className="label">Experience Required <span className="text-red-500">*</span></label>
          <select name="experience_required" required defaultValue={v("experience_required") || "mid"} className="input">
            {EXPERIENCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Salary */}
      <div>
        <label className="label">Salary Range (optional)</label>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
            <input name="salary_min" type="number" min="0" defaultValue={initial?.salary_min ?? ""}
              placeholder="Min"
              className="input pl-7" />
          </div>
          <span className="text-gray-400">–</span>
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
            <input name="salary_max" type="number" min="0" defaultValue={initial?.salary_max ?? ""}
              placeholder="Max"
              className="input pl-7" />
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="label">Job Description <span className="text-red-500">*</span></label>
        <textarea name="description" required rows={6} defaultValue={v("description")}
          placeholder="Describe the role, responsibilities, and what you're looking for…"
          className="input resize-none" />
      </div>

      {/* Skills */}
      <div>
        <label className="label">Required Skills <span className="text-red-500">*</span></label>
        <input name="required_skills" required
          defaultValue={initial?.required_skills?.join(", ") ?? ""}
          placeholder="e.g. React, TypeScript, Node.js"
          className="input" />
        <p className="mt-1 text-xs text-gray-400">Separate skills with commas.</p>
      </div>

      {/* Status */}
      <div className="w-48">
        <label className="label">Status</label>
        <select name="status" defaultValue={v("status") || "active"} className="input">
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
        <button type="submit" disabled={isPending}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60">
          {isPending ? "Saving…" : (initial ? "Save changes" : "Create job post")}
        </button>
        <Link href="/dashboard/jobs"
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50">
          Cancel
        </Link>
      </div>
    </form>
  );
}
