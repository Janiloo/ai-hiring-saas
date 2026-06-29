import PageHeader from "@/components/PageHeader";
import CandidateForm from "@/components/candidates/CandidateForm";
import { createCandidate } from "@/lib/actions/candidates";
import { getJobPosts } from "@/lib/queries/job-posts";

export default async function NewCandidatePage() {
  // Load all active jobs for the assignment dropdown (fetch up to 100)
  const { data: jobs } = await getJobPosts({ status: "active", page: 1 });
  const jobOptions = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    department: j.department,
  }));

  return (
    <div className="flex flex-col gap-6 p-8">
      <PageHeader
        title="Add Candidate"
        subtitle="Enter the candidate's details and assign them to a job post."
      />
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <CandidateForm
          action={createCandidate}
          jobs={jobOptions}
          cancelHref="/dashboard/candidates"
        />
      </div>
    </div>
  );
}
