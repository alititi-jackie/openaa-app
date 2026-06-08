import { ProfileManagementPageHeader, ProfilePublishLink } from "@/components/profile/ProfileManagementPageHeader";
import { ProfilePostFilterTabs } from "@/components/profile/ProfilePostFilterTabs";
import { ProfileUserPostsList } from "@/components/profile/ProfileUserPostsList";
import { filterAndSortProfilePosts, normalizeProfilePostTab } from "@/features/posts/profileTabs";
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

export default async function ProfileJobsPage({ searchParams }: { searchParams?: Promise<{ tab?: string | string[] }> }) {
  const params = await searchParams;
  const rawTab = Array.isArray(params?.tab) ? params?.tab[0] : params?.tab;
  const activeTab = normalizeProfilePostTab("job", rawTab);
  const user = await getCurrentUser();

  if (!user) {
    redirectToAuthRequired("/profile/jobs");
  }

  const posts = await getMyPosts("job");
  const visiblePosts = filterAndSortProfilePosts(posts.data, activeTab);

  return (
    <div className="space-y-4">
      <ProfileManagementPageHeader
        title="我的招聘"
        description="管理您发布的招聘岗位与求职信息"
        actions={<ProfilePublishLink href="/jobs/publish" label="+ 发布招聘" />}
      />
      <ProfilePostFilterTabs postType="job" activeTab={activeTab} path="/profile/jobs" />
      <ProfileUserPostsList key={activeTab} posts={visiblePosts} listKey={activeTab} />
    </div>
  );
}
