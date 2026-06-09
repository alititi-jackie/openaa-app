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
  title: "我的房屋",
  description: "OpenAA 我的房屋发布管理页。",
  path: "/profile/housing",
  noIndex: true,
});

export default async function ProfileHousingPage({ searchParams }: { searchParams?: Promise<{ tab?: string | string[] }> }) {
  const params = await searchParams;
  const rawTab = Array.isArray(params?.tab) ? params?.tab[0] : params?.tab;
  const activeTab = normalizeProfilePostTab("housing", rawTab);
  const user = await getCurrentUser();

  if (!user) {
    redirectToAuthRequired("/profile/housing");
  }

  const posts = await getMyPosts("housing");
  const visiblePosts = filterAndSortProfilePosts(posts.data, activeTab);

  return (
    <div className="space-y-4">
      <ProfileManagementPageHeader
        title="我的房屋"
        description="管理您发布的房屋出租与求租信息"
        actions={<ProfilePublishLink href="/housing/publish" label="+ 发布房源" />}
      />
      <ProfilePostFilterTabs postType="housing" activeTab={activeTab} path="/profile/housing" />
      <ProfileUserPostsList key={activeTab} posts={visiblePosts} />
    </div>
  );
}
