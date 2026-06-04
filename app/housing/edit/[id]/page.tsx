import { PostForm } from "@/components/forms/PostForm";
import { PageShell } from "@/components/layout/PageShell";
import { formValuesFromDetail } from "@/features/posts/formMappers";
import { getEditablePostById } from "@/features/posts/queries";
import { redirectToAuthRequired } from "@/lib/auth/redirects";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({ title: "编辑房屋", path: "/housing/edit", noIndex: true });

export default async function HousingEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirectToAuthRequired(`/housing/edit/${id}`);

  const post = await getEditablePostById(id, "housing");
  if (!post.data) {
    return <PageShell title="无法编辑" description={post.error ?? "内容不存在，或你没有编辑权限。"} eyebrow="Edit" />;
  }

  return <PostForm mode="edit" postType="housing" initialValues={formValuesFromDetail(post.data)} legacyParity />;
}
