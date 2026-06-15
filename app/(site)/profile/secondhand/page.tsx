import { ProfileManagementPageHeader, ProfilePublishLink } from "@/components/profile/ProfileManagementPageHeader";
import { ProfilePostFilters } from "@/components/profile/ProfilePostFilters";
import { ProfileUserPostsList } from "@/components/profile/ProfileUserPostsList";
import { buildProfilePostStatusOptions, buildProfilePostTypeOptions, filterAndSortProfilePosts, normalizeProfilePostFilters } from "@/features/posts/profileTabs";
import { getMyPosts } from "@/features/posts/queries";
import { redirectToAuthRequired } from "@/lib/auth/redirects";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "我的商品",
  description: "OpenAA 我的商品发布管理页。",
  path: "/profile/secondhand",
  noIndex: true,
});

export default async function ProfileSecondhandPage({ searchParams }: { searchParams?: Promise<{ type?: string | string[]; status?: string | string[]; tab?: string | string[] }> }) {
  const params = await searchParams;
  const filters = normalizeProfilePostFilters("marketplace", params);
  const user = await getCurrentUser();

  if (!user) {
    redirectToAuthRequired("/profile/secondhand");
  }

  const posts = await getMyPosts("marketplace");
  const visiblePosts = filterAndSortProfilePosts(posts.data, filters);

  return (
    <div className="space-y-4">
      <ProfileManagementPageHeader
        title="我的商品"
        description="管理您发布的二手出售与求购信息"
        actions={<ProfilePublishLink href="/secondhand/publish" label="+ 发布商品" />}
      />
      <ProfilePostFilters
        path="/profile/secondhand"
        typeOptions={buildProfilePostTypeOptions("marketplace")}
        statusOptions={buildProfilePostStatusOptions(posts.data)}
        selectedType={filters.selectedType}
        selectedStatus={filters.selectedStatus}
      />
      <ProfileUserPostsList key={`${filters.selectedType}:${filters.selectedStatus}`} posts={visiblePosts} />
    </div>
  );
}
