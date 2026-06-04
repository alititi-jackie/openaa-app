import { UserJobsList } from "@/components/jobs/UserJobsList";
import { PageShell } from "@/components/layout/PageShell";
import { PublishCta } from "@/components/posts/PublishCta";
import { getMyPosts } from "@/features/posts/queries";
import { redirectToAuthRequired } from "@/lib/auth/redirects";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "我的招聘",
  description: "OpenAA 我的招聘发布管理页面。",
  path: "/profile/my-jobs",
  noIndex: true,
});

export default async function ProfileMyJobsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirectToAuthRequired("/profile/my-jobs");
  }

  const posts = await getMyPosts("job");

  return (
    <PageShell
      title="我的招聘"
      description="管理您发布的招聘岗位与求职信息"
      eyebrow="Profile"
      actions={<PublishCta returnTo="/jobs" label="发布招聘" />}
      keepActionsInline
    >
      <UserJobsList posts={posts.data} />
    </PageShell>
  );
}
