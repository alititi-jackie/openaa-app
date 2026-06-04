import { PageShell } from "@/components/layout/PageShell";
import { UserPostsList } from "@/components/posts/UserPostsList";
import { getMyPosts } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCurrentUser } from "@/lib/supabase/server";

import { redirectToAuthRequired } from "@/lib/auth/redirects";
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "我的二手",
  description: "OpenAA 我的二手市场发布管理页。",
  path: "/profile/marketplace",
  noIndex: true,
});

export default async function ProfileMarketplacePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirectToAuthRequired("/profile/marketplace");
  }

  const posts = await getMyPosts("marketplace");

  return (
    <PageShell title="我的二手" description="管理当前账号自己的二手市场内容。" eyebrow="Profile">
      <UserPostsList posts={posts.data} />
    </PageShell>
  );
}
