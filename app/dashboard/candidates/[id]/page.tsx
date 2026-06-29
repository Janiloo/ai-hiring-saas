import { notFound } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import CandidateStageBadge from "@/components/candidates/CandidateStageBadge";
import StageSelector from "@/components/candidates/StageSelector";
import DeleteCandidateButton from "@/components/candidates/DeleteCandidateButton";
import ActivityTimeline from "@/components/candidates/ActivityTimeline";
import EmailDraftCard from "@/components/candidates/EmailDraftCard";
import { getCandidateById } from "@/lib/queries/candidates";
import { getCandidateActivityLogs } from "@/lib/queries/activity-logs";
import { getEmailDraftsForCandidate } from "@/lib/queries/email-drafts";
import { getUserOrganization } from "@/lib/queries/invitations";
import type { AIRecommendation } from "@/types/candidate";

interface PageProps {
  params: Promise<{ id: string }>;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const APPLIED_VIA_LABELS: Record<string, string> = {
  manual: "Manual Entry",
  email:  "Email Application",
  api:    "API / Integration",
};

const AI_RECOMMENDATION_META: Record<
  AIRecommendation,
  { label: string; color: string; icon: string }
> = {
  interview: { label: "Proceed to Interview", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: "✓" },
  review:    { label: "Needs Review",          color: "text-yellow-700 bg-yellow-50 border-yellow-200",   icon: "?" },
  reject:    { label: "Not a Fit",             color: "text-red-600   bg-red-50    border-red-200",       icon: "✕" },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</dt>
      <dd className="text-sm text-gray-900">{value ?? <span className="text-gray-400">—</span>}</dd>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-3.5">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function CandidateDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [candidate, orgResult] = await Promise.all([
    getCandidateById(id),
    getUserOrganization(),
  ]);
  if (!candidate) notFound();

  const orgRole   = orgResult?.member.role ?? null;
  const canManage = orgRole === "admin" || orgRole === "recruiter";

  const appliedDate = new Date(candidate.created_at).toLocaleDateString("en-US", {
    month: "long",
    day:   "numeric",
    year:  "numeric",
  });

  const [activities, emailDrafts] = await Promise.all([
    getCandidateActivityLogs(id),
    getEmailDraftsForCandidate(id),
  ]);

  const appliedViaLabel =
    APPLIED_VIA_LABELS[(candidate as any).applied_via ?? "manual"] ?? "Manual Entry";

  const aiScore          = (candidate as any).ai_score          as number | null | undefined;
  const aiRecommendation = (candidate as any).ai_recommendation as AIRecommendation | null | undefined;
  const aiReason         = (candidate as any).ai_reason         as string | null | undefined;
  const aiStatus         = (candidate as any).ai_status         as string | null | undefined;

  const hasAiResult = aiStatus === "completed" && aiScore != null;

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 max-w-6xl">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/dashboard/candidates"
            className="mb-1 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          >
            ← Candidates
          </Link>
          <PageHeader title={candidate.full_name} subtitle={candidate.email} />
        </div>
        {canManage && (
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/dashboard/candidates/${id}/edit`}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Edit
            </Link>
            <DeleteCandidateButton id={id} />
          </div>
        )}
      </div>

      {/* ── Two-column layout ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ── Left column (main) ────────────────────────────────────────── */}
        <div className="flex flex-col gap-6 lg:col-span-2">

          {/* 1. Candidate Overview Card */}
          <SectionCard title="Candidate Overview">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <InfoRow label="Full Name" value={candidate.full_name} />
              <InfoRow
                label="Email"
                value={
                  <a
                    href={`mailto:${candidate.email}`}
                    className="text-indigo-600 hover:underline"
                  >
                    {candidate.email}
                  </a>
                }
              />
              <InfoRow
                label="Phone"
                value={
                  candidate.phone ? (
                    <a
                      href={`tel:${candidate.phone}`}
                      className="text-indigo-600 hover:underline"
                    >
                      {candidate.phone}
                    </a>
                  ) : null
                }
              />
              <InfoRow label="Applied" value={appliedDate} />
              {candidate.resume_url && (
                <InfoRow
                  label="Resume"
                  value={
                    <a
                      href={candidate.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                    >
                      View Resume ↗
                    </a>
                  }
                />
              )}
              <InfoRow
                label="Current Stage"
                value={<CandidateStageBadge stage={candidate.stage} />}
              />
            </div>
          </SectionCard>

          {/* 2. Application Details */}
          <SectionCard title="Application Details">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <InfoRow
                label="Job Applied To"
                value={
                  candidate.job_post ? (
                    <span className="font-medium text-gray-900">
                      {candidate.job_post.title}
                      {candidate.job_post.department && (
                        <span className="ml-1 font-normal text-gray-500">
                          · {candidate.job_post.department}
                        </span>
                      )}
                    </span>
                  ) : null
                }
              />
              <InfoRow
                label="Application Source"
                value={
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                    {appliedViaLabel}
                  </span>
                }
              />
              <InfoRow
                label="Status"
                value={<CandidateStageBadge stage={candidate.stage} />}
              />
            </div>
          </SectionCard>

          {/* Notes */}
          {candidate.notes && (
            <SectionCard title="Notes">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {candidate.notes}
              </p>
            </SectionCard>
          )}

          {/* 3. Activity Timeline */}
          <SectionCard title="Activity Timeline">
            <ActivityTimeline activities={activities} />
          </SectionCard>

          {/* 4. Email Drafts */}
          <SectionCard title={`Email Drafts${emailDrafts.length > 0 ? ` (${emailDrafts.length})` : ""}`}>
            {emailDrafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-base text-gray-400">
                  ✉
                </div>
                <p className="text-sm font-medium text-gray-500">No email drafts</p>
                <p className="mt-1 text-xs text-gray-400">
                  Drafts generated by automation will appear here for approval.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {emailDrafts.map((draft) => (
                  <EmailDraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── Right sidebar ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">

          {/* Hiring Stage — real, live */}
          <SectionCard title="Hiring Stage">
            <div className="mb-3">
              <CandidateStageBadge stage={candidate.stage} />
            </div>
            {canManage && (
              <>
                <p className="mb-2 text-xs text-gray-400">Update stage:</p>
                <StageSelector
                  candidateId={candidate.id}
                  currentStage={candidate.stage}
                />
              </>
            )}
          </SectionCard>

          {/* Applied Role */}
          {candidate.job_post && (
            <SectionCard title="Applied Role">
              <p className="text-sm font-semibold text-gray-900">
                {candidate.job_post.title}
              </p>
              {candidate.job_post.department && (
                <p className="mt-0.5 text-xs text-gray-500">
                  {candidate.job_post.department}
                </p>
              )}
            </SectionCard>
          )}

          {/* 4. AI Evaluation — read-only placeholder */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-gray-900">AI Evaluation</h2>
              <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-600">
                Beta
              </span>
            </div>
            <div className="p-5">
              {hasAiResult ? (
                <div className="flex flex-col gap-4">
                  {/* Score */}
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Score
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-gray-900">{aiScore}</span>
                      <span className="text-sm text-gray-400">/ 100</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-indigo-500 transition-all"
                        style={{ width: `${aiScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Recommendation */}
                  {aiRecommendation && (
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Recommendation
                      </p>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${AI_RECOMMENDATION_META[aiRecommendation].color}`}
                      >
                        {AI_RECOMMENDATION_META[aiRecommendation].icon}{" "}
                        {AI_RECOMMENDATION_META[aiRecommendation].label}
                      </span>
                    </div>
                  )}

                  {/* Reasoning */}
                  {aiReason && (
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Reasoning
                      </p>
                      <p className="text-sm leading-relaxed text-gray-700">{aiReason}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-lg text-purple-400">
                    ◆
                  </div>
                  <p className="text-sm font-medium text-gray-600">Not evaluated yet</p>
                  <p className="text-xs text-gray-400 leading-snug">
                    AI scoring will run automatically after evaluation is enabled.
                  </p>
                  {aiStatus === "processing" && (
                    <span className="mt-1 rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                      Processing…
                    </span>
                  )}
                  {aiStatus === "failed" && (
                    <span className="mt-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
                      Evaluation failed
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 5. Actions Panel — UI only */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-gray-900">Actions</h2>
            </div>
            <div className="flex flex-col gap-2 p-5">
              <button
                disabled
                title="Stage changes are managed in the Hiring Stage card above"
                className="flex w-full items-center gap-2.5 rounded-lg border border-gray-200 px-4 py-2.5 text-left text-sm font-medium text-gray-400 cursor-not-allowed opacity-60"
              >
                <span className="text-base leading-none">⇅</span>
                Change Stage
              </button>

              <Link
                href={`/dashboard/interviews/new?candidate_id=${candidate.id}`}
                className="flex w-full items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-left text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                <span className="text-base leading-none">🗓</span>
                Schedule Interview
              </Link>

              <Link
                href={`/dashboard/candidates/${candidate.id}/edit`}
                className="flex w-full items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-left text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                <span className="text-base leading-none">✏️</span>
                Add / Edit Notes
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
