import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import CandidateForm from "@/components/candidates/CandidateForm";
import { getCandidateById } from "@/lib/queries/candidates";
import { getJobPosts } from "@/lib/queries/job-posts";
import { updateCandidate } from "@/lib/actions/candidates";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCandidatePage({ params }: PageProps) {
  const { id } = await params;

  const [candidate, { data: jobs }] = await Promise.all([
    getCandidateById(id),
    getJobPosts({ page: 1 }),
  ]);

  if (!candidate) notFound();

  const jobOptions = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    department: j.department,
  }));

  const updateAction = updateCandidate.bind(null, id);

  return (
    <div className="flex flex-col gap-6 p-8">
      <PageHeader
        title="Edit Candidate"
        subtitle={`Editing: ${candidate.full_name}`}
      />
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <CandidateForm
          action={updateAction}
          initial={candidate}
          jobs={jobOptions}
          cancelHref={`/dashboard/candidates/${id}`}
        />
      </div>
    </div>
  );
}
