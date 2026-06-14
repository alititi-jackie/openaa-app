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
  title: "我的房屋",
  description: "OpenAA 我的房屋发布管理页。",
  path: "/profile/housing",
  noIndex: true,
});

export default async function ProfileHousingPage({ searchParams }: { searchParams?: Promise<{ type?: string | string[]; status?: string | string[]; tab?: string | string[] }> }) {
  const params = await searchParams;
  const filters = normalizeProfilePostFilters("housing", params);
  const user = await getCurrentUser();

  if (!user) {
    redirectToAuthRequired("/profile/housing");
  }

  const posts = await getMyPosts("housing");
  const visiblePosts = filterAndSortProfilePosts(posts.data, filters);

  return (
    <div className="space-y-4">
      <ProfileManagementPageHeader
        title="我的房屋"
        description="管理您发布的房屋出租与求租信息"
        actions={<ProfilePublishLink href="/housing/publish" label="+ 发布房源" />}
      />
      <ProfilePostFilters
        path="/profile/housing"
        typeOptions={buildProfilePostTypeOptions("housing")}
        statusOptions={buildProfilePostStatusOptions(posts.data)}
        selectedType={filters.selectedType}
        selectedStatus={filters.selectedStatus}
      />
      <ProfileUserPostsList key={`${filters.selectedType}:${filters.selectedStatus}`} posts={visiblePosts} />
    </div>
  );
}
