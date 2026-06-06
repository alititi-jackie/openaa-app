import { PageShell } from "@/components/layout/PageShell";
import { PublishCta } from "@/components/posts/PublishCta";
import { UserPostsList } from "@/components/posts/UserPostsList";
import { getMyPosts } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCurrentUser } from "@/lib/supabase/server";

import { redirectToAuthRequired } from "@/lib/auth/redirects";
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "我的招聘",
  description: "OpenAA 我的招聘发布管理页。",
  path: "/profile/jobs",
  noIndex: true,
});

export default async function ProfileJobsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirectToAuthRequired("/profile/jobs");
  }

  const posts = await getMyPosts("job");

  return (
    <PageShell
      title="我的招聘"
      description="管理当前账号自己的招聘内容。"
      actions={<PublishCta returnTo="/jobs" label="发布招聘" />}
      keepActionsInline
    >
      <UserPostsList posts={posts.data} />
    </PageShell>
  );
}
