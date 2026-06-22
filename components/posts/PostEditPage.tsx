import { PageShell } from "@/components/layout/PageShell";
import { PostForm } from "@/components/forms/PostForm";
import { formValuesFromDetail } from "@/features/posts/formMappers";
import { getEditablePostById } from "@/features/posts/queries";
import type { PostType } from "@/features/posts/types";
import { redirectToAuthRequired } from "@/lib/auth/redirects";
import { getCurrentUser } from "@/lib/supabase/server";

export async function PostEditPage({ id, postType, returnTo }: { id: string; postType: PostType; returnTo: string }) {
  const user = await getCurrentUser();
  if (!user) redirectToAuthRequired(returnTo);

  const post = await getEditablePostById(id, postType);
  if (!post.data) {
    return <PageShell title="无法编辑" description={post.error ?? "内容不存在，或你没有编辑权限。"} eyebrow="Edit" />;
  }

  return <PostForm mode="edit" postType={postType} initialValues={formValuesFromDetail(post.data)} />;
}
