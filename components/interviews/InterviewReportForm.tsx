"use client";

import { useActionState, useState } from "react";
import { submitInterviewReport, type ActionState } from "@/lib/actions/interview-reports";
import { RECOMMENDATION_META, type ReportRecommendation } from "@/types/interview-report";

interface Props {
  interviewId: string;
}

const RECOMMENDATIONS: ReportRecommendation[] = ["pass", "maybe", "fail"];

export default function InterviewReportForm({ interviewId }: Props) {
  const [state, action, isPending] = useActionState<ActionState, FormData>(
    submitInterviewReport,
    null
  );
  const [rating, setRating] = useState(0);

  if (state && "success" in state) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
        <span className="text-lg">✅</span>
        <p className="text-sm font-medium text-emerald-800">
          Report submitted. The recruiting team has been notified.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Submit Interview Report</h2>
        <p className="mt-0.5 text-xs text-gray-400">
          Your evaluation is shared with recruiters and admins. It does not change the candidate&apos;s pipeline stage.
        </p>
      </div>

      <input type="hidden" name="interview_id" value={interviewId} />
      <input type="hidden" name="rating" value={rating} />

      {/* Rating */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-700">Rating *</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              className={`text-2xl transition ${n <= rating ? "text-yellow-400" : "text-gray-200 hover:text-yellow-200"}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Recommendation */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-700">Recommendation *</label>
        <div className="flex gap-2">
          {RECOMMENDATIONS.map((r) => (
            <label
              key={r}
              className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition has-[:checked]:ring-2 has-[:checked]:ring-indigo-500 ${RECOMMENDATION_META[r].color}`}
            >
              <input type="radio" name="recommendation" value={r} required className="sr-only" />
              {RECOMMENDATION_META[r].label}
            </label>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="report-notes" className="mb-1.5 block text-xs font-medium text-gray-700">Notes</label>
        <textarea
          id="report-notes"
          name="notes"
          rows={4}
          placeholder="Strengths, concerns, technical depth, communication…"
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
        />
      </div>

      {state && "error" in state && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending || rating === 0}
        className="self-start rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {isPending ? "Submitting…" : "Submit Report"}
      </button>
    </form>
  );
}
