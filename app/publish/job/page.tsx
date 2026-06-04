import { PostForm } from "@/components/forms/PostForm";
import { emptyPostFormValues } from "@/features/posts/formMappers";
import type { JobFields } from "@/features/posts/formTypes";
import { redirectToAuthRequired } from "@/lib/auth/redirects";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "发布招聘",
  description: "发布纽约华人招聘或求职信息。",
  path: "/publish/job",
  noIndex: true,
});

type PublishJobSearchParams = Promise<{ type?: string }>;

function initialJobValues(type?: string) {
  const values = emptyPostFormValues("job");
  values.job = {
    ...values.job!,
    job_mode: type === "seeking" ? ("seeking" as JobFields["job_mode"]) : ("hiring" as JobFields["job_mode"]),
  };
  return values;
}

export default async function PublishJobPage({ searchParams }: { searchParams: PublishJobSearchParams }) {
  const user = await getCurrentUser();
  if (!user) redirectToAuthRequired("/publish/job");

  const params = await searchParams;

  return <PostForm mode="create" postType="job" initialValues={initialJobValues(params.type)} legacyParity />;
}
