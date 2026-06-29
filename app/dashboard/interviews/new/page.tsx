import PageHeader from "@/components/PageHeader";
import InterviewForm from "@/components/interviews/InterviewForm";
import { createInterview } from "@/lib/actions/interviews";
import { getAllCandidates } from "@/lib/queries/candidates";
import { getAllJobPosts } from "@/lib/queries/job-posts";

export default async function NewInterviewPage() {
  const [candidates, jobs] = await Promise.all([getAllCandidates(), getAllJobPosts()]);

  return (
    <div className="flex flex-col gap-6 p-8 max-w-3xl">
      <PageHeader title="Schedule Interview" subtitle="Set up a new interview with a candidate." />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <InterviewForm
          action={createInterview}
          candidates={candidates}
          jobs={jobs}
          cancelHref="/dashboard/interviews"
        />
      </div>
    </div>
  );
}
