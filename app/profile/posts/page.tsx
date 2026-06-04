import { PageShell } from "@/components/layout/PageShell";
import { UserPostsList } from "@/components/posts/UserPostsList";
import { getMyPosts } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCurrentUser } from "@/lib/supabase/server";

import { redirectToAuthRequired } from "@/lib/auth/redirects";
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "我的发布",
  description: "OpenAA 我的发布管理页。",
  path: "/profile/posts",
  noIndex: true,
});

export default async function ProfilePostsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirectToAuthRequired("/profile/posts");
  }

  const posts = await getMyPosts();

  return (
    <PageShell title="我的发布" description="管理当前账号自己的招聘、房屋、二手和服务内容。" eyebrow="Profile">
      <UserPostsList posts={posts.data} note={posts.state === "missing_config" ? "Supabase 环境变量尚未配置，当前显示空列表。" : undefined} />
    </PageShell>
  );
}
