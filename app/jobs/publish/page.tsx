import { PostForm } from "@/components/forms/PostForm";
import { emptyPostFormValues } from "@/features/posts/formMappers";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCurrentUser } from "@/lib/supabase/server";

import { redirectToAuthRequired } from "@/lib/auth/redirects";
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "发布招聘",
  description: "发布纽约华人招聘或求职信息。",
  path: "/jobs/publish",
  noIndex: true,
});

export default async function JobsPublishPage() {
  const user = await getCurrentUser();
  if (!user) redirectToAuthRequired("/jobs/publish");

  return <PostForm mode="create" postType="job" initialValues={emptyPostFormValues("job")} />;
}
