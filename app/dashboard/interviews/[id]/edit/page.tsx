import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import InterviewForm from "@/components/interviews/InterviewForm";
import { getInterviewById, getOrgInterviewers } from "@/lib/queries/interviews";
import { updateInterview } from "@/lib/actions/interviews";
import { getAllCandidates } from "@/lib/queries/candidates";
import { getAllJobPosts } from "@/lib/queries/job-posts";

interface PageProps { params: Promise<{ id: string }> }

export default async function EditInterviewPage({ params }: PageProps) {
  const { id } = await params;
  const [interview, candidates, jobs, interviewers] = await Promise.all([
    getInterviewById(id),
    getAllCandidates(),
    getAllJobPosts(),
    getOrgInterviewers(),
  ]);

  if (!interview) notFound();

  const action = updateInterview.bind(null, id);

  return (
    <div className="flex flex-col gap-6 p-8 max-w-3xl">
      <PageHeader title="Edit Interview" subtitle={`Editing interview for ${interview.candidate?.full_name ?? "candidate"}`} />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <InterviewForm
          action={action}
          initial={interview}
          candidates={candidates}
          jobs={jobs}
          interviewers={interviewers}
          cancelHref={`/dashboard/interviews/${id}`}
        />
      </div>
    </div>
  );
}
