import { PublishCta } from "@/components/posts/PublishCta";
import { ProfileManagementPageHeader } from "@/components/profile/ProfileManagementPageHeader";
import { ProfileUserPostsList } from "@/components/profile/ProfileUserPostsList";
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
    <div className="space-y-4">
      <ProfileManagementPageHeader
        title="我的招聘"
        description="管理您发布的招聘岗位与求职信息"
        actions={<PublishCta returnTo="/jobs" label="+ 发布招聘" />}
      />
      <ProfileUserPostsList posts={posts.data} />
    </div>
  );
}
