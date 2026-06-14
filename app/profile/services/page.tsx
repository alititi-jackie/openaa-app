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
  title: "我的服务",
  description: "OpenAA 我的本地服务发布管理页。",
  path: "/profile/services",
  noIndex: true,
});

export default async function ProfileServicesPage({ searchParams }: { searchParams?: Promise<{ type?: string | string[]; status?: string | string[]; tab?: string | string[] }> }) {
  const params = await searchParams;
  const filters = normalizeProfilePostFilters("service", params);
  const user = await getCurrentUser();

  if (!user) {
    redirectToAuthRequired("/profile/services");
  }

  const posts = await getMyPosts("service");
  const visiblePosts = filterAndSortProfilePosts(posts.data, filters);

  return (
    <div className="space-y-4">
      <ProfileManagementPageHeader
        title="我的服务"
        description="管理您发布的本地服务信息"
        actions={<ProfilePublishLink href="/services/publish" label="+ 发布服务" />}
      />
      <ProfilePostFilters
        path="/profile/services"
        typeOptions={buildProfilePostTypeOptions("service")}
        statusOptions={buildProfilePostStatusOptions(posts.data)}
        selectedType={filters.selectedType}
        selectedStatus={filters.selectedStatus}
      />
      <ProfileUserPostsList key={`${filters.selectedType}:${filters.selectedStatus}`} posts={visiblePosts} />
    </div>
  );
}
