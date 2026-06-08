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
  title: "我的服务",
  description: "OpenAA 我的本地服务发布管理页。",
  path: "/profile/services",
  noIndex: true,
});

export default async function ProfileServicesPage({ searchParams }: { searchParams?: Promise<{ tab?: string | string[] }> }) {
  const params = await searchParams;
  const rawTab = Array.isArray(params?.tab) ? params?.tab[0] : params?.tab;
  const activeTab = normalizeProfilePostTab("service", rawTab);
  const user = await getCurrentUser();

  if (!user) {
    redirectToAuthRequired("/profile/services");
  }

  const posts = await getMyPosts("service");
  const visiblePosts = filterAndSortProfilePosts(posts.data, activeTab);

  return (
    <div className="space-y-4">
      <ProfileManagementPageHeader
        title="我的服务"
        description="管理您发布的本地服务信息"
        actions={<ProfilePublishLink href="/services/publish" label="+ 发布服务" />}
      />
      <ProfilePostFilterTabs postType="service" activeTab={activeTab} path="/profile/services" />
      <ProfileUserPostsList posts={visiblePosts} />
    </div>
  );
}
