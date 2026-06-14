import { ProfileManagementPageHeader, ProfilePublishLink } from "@/components/profile/ProfileManagementPageHeader";
import { ProfilePostFilters } from "@/components/profile/ProfilePostFilters";
import { ProfileUserPostsList } from "@/components/profile/ProfileUserPostsList";
import { buildProfilePostStatusOptions, buildProfilePostTypeOptions, filterAndSortProfilePosts, normalizeProfilePostFilters } from "@/features/posts/profileTabs";
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

export default async function ProfileJobsPage({ searchParams }: { searchParams?: Promise<{ type?: string | string[]; status?: string | string[]; tab?: string | string[] }> }) {
  const params = await searchParams;
  const filters = normalizeProfilePostFilters("job", params);
  const user = await getCurrentUser();

  if (!user) {
    redirectToAuthRequired("/profile/jobs");
  }

  const posts = await getMyPosts("job");
  const visiblePosts = filterAndSortProfilePosts(posts.data, filters);

  return (
    <div className="space-y-4">
      <ProfileManagementPageHeader
        title="我的招聘"
        description="管理您发布的招聘岗位与求职信息"
        actions={<ProfilePublishLink href="/jobs/publish" label="+ 发布招聘" />}
      />
      <ProfilePostFilters
        path="/profile/jobs"
        typeOptions={buildProfilePostTypeOptions("job")}
        statusOptions={buildProfilePostStatusOptions(posts.data)}
        selectedType={filters.selectedType}
        selectedStatus={filters.selectedStatus}
      />
      <ProfileUserPostsList key={`${filters.selectedType}:${filters.selectedStatus}`} posts={visiblePosts} />
    </div>
  );
}
