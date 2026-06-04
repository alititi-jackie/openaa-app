import { PageShell } from "@/components/layout/PageShell";
import { PostForm } from "@/components/forms/PostForm";
import { formValuesFromDetail } from "@/features/posts/formMappers";
import { getEditablePostById } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCurrentUser } from "@/lib/supabase/server";

import { redirectToAuthRequired } from "@/lib/auth/redirects";
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({ title: "编辑招聘", path: "/jobs/edit", noIndex: true });

export default async function JobsEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirectToAuthRequired(`/jobs/edit/${id}`);

  const post = await getEditablePostById(id, "job");
  if (!post.data) return <PageShell title="无法编辑" description={post.error ?? "内容不存在，或你没有编辑权限。"} eyebrow="Edit" />;

  return <PostForm mode="edit" postType="job" initialValues={formValuesFromDetail(post.data)} legacyParity />;
}
