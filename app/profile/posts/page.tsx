import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { UserPostsList } from "@/components/posts/UserPostsList";
import { getMyPosts } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "我的发布",
  description: "OpenAA 我的发布基础页。",
  path: "/profile/posts",
  noIndex: true,
});

export default async function ProfilePostsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?returnTo=/profile/posts");
  }

  const posts = await getMyPosts();

  return (
    <PageShell title="我的发布" description="只读显示当前账号自己的发布状态。本阶段不提供编辑、删除或恢复。" eyebrow="Profile">
      <UserPostsList posts={posts.data} note={posts.state === "missing_config" ? "Supabase 环境变量尚未配置，当前显示空列表。" : undefined} />
    </PageShell>
  );
}
