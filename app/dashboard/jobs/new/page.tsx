import PageHeader from "@/components/PageHeader";
import JobPostForm from "@/components/jobs/JobPostForm";
import { createJobPost } from "@/lib/actions/job-posts";

export default function NewJobPostPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <PageHeader
        title="New Job Post"
        subtitle="Fill in the details to publish a new open role."
      />
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <JobPostForm action={createJobPost} />
      </div>
    </div>
  );
}
