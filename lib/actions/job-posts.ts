"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getUserOrgMembership } from "@/lib/utils/get-user-org";
import { type JobPostInsert, type EmploymentType, type JobStatus } from "@/types/job-post";

export type ActionState = { error: string } | null;

function parseFormData(formData: FormData): JobPostInsert {
  const skillsRaw = (formData.get("required_skills") as string) ?? "";
  const required_skills = skillsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const salaryMin = formData.get("salary_min") as string;
  const salaryMax = formData.get("salary_max") as string;

  return {
    title:               (formData.get("title") as string).trim(),
    department:          (formData.get("department") as string).trim(),
    employment_type:     formData.get("employment_type") as EmploymentType,
    location:            (formData.get("location") as string).trim(),
    experience_required: formData.get("experience_required") as string,
    salary_min:          salaryMin ? parseInt(salaryMin, 10) : null,
    salary_max:          salaryMax ? parseInt(salaryMax, 10) : null,
    description:         (formData.get("description") as string).trim(),
    required_skills,
    status:              (formData.get("status") as JobStatus) ?? "active",
  };
}

export async function createJobPost(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies();
  const supabase    = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const membership = await getUserOrgMembership(supabase);
  if (!membership) return { error: "You must belong to an organization to create job posts." };
  if (membership.orgRole === "interviewer") return { error: "Interviewers cannot create job posts." };

  const { orgId: organization_id } = membership;
  const payload = parseFormData(formData);

  const { error } = await supabase
    .from("job_posts")
    .insert({ ...payload, user_id: user.id, organization_id });

  if (error) return { error: error.message };

  redirect("/dashboard/jobs");
}

export async function updateJobPost(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies();
  const supabase    = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const membership = await getUserOrgMembership(supabase);
  if (!membership) return { error: "You must belong to an organization." };
  if (membership.orgRole === "interviewer") return { error: "Interviewers cannot edit job posts." };

  const payload = parseFormData(formData);

  // RLS enforces: admin or recruiter in the same org can update
  const { error } = await supabase
    .from("job_posts")
    .update(payload)
    .eq("id", id);

  if (error) return { error: error.message };

  redirect("/dashboard/jobs");
}

export async function deleteJobPost(id: string): Promise<ActionState> {
  const cookieStore = await cookies();
  const supabase    = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const membership = await getUserOrgMembership(supabase);
  if (!membership) return { error: "You must belong to an organization." };
  if (membership.orgRole === "interviewer") return { error: "Interviewers cannot delete job posts." };

  // RLS enforces: creator or admin can delete
  const { error } = await supabase
    .from("job_posts")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  redirect("/dashboard/jobs");
}
