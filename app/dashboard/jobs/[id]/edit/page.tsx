import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import JobPostForm from "@/components/jobs/JobPostForm";
import GeneratedAdPanel from "@/components/jobs/GeneratedAdPanel";
import { getJobPostById } from "@/lib/queries/job-posts";
import { updateJobPost } from "@/lib/actions/job-posts";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditJobPostPage({ params }: PageProps) {
  const { id } = await params;
  const job = await getJobPostById(id);
  if (!job) notFound();

  const updateAction = updateJobPost.bind(null, id);

  return (
    <div className="flex flex-col gap-6 p-8">
      <PageHeader
        title="Edit Job Post"
        subtitle={`Editing: ${job.title}`}
      />
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <JobPostForm action={updateAction} initial={job} />
      </div>

      {/* Existing AI advertisement. "Regenerate AI Job Post" uses the job's
          saved fields (save your edits above first) and asks for confirmation
          before replacing the stored content. */}
      <GeneratedAdPanel
        jobId={job.id}
        ad={job.generated_ad}
        generatedAt={job.generated_ad_at}
        canManage
      />
    </div>
  );
}
