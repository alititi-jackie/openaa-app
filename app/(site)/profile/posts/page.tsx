import { ProfileManagementPageHeader, ProfilePublishLink } from "@/components/profile/ProfileManagementPageHeader";
import { ProfilePostFilters } from "@/components/profile/ProfilePostFilters";
import { ProfileUserPostsList } from "@/components/profile/ProfileUserPostsList";
import { UserPostsList } from "@/components/posts/UserPostsList";
import { postChannelConfig } from "@/features/posts/channelConfig";
import { buildProfilePostStatusOptions, buildProfilePostTypeOptions, filterAndSortProfilePosts, normalizeProfilePostFilters } from "@/features/posts/profileTabs";
import { getMyPosts } from "@/features/posts/queries";
import type { PostType } from "@/features/posts/types";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCurrentUser } from "@/lib/supabase/server";

import { redirectToAuthRequired } from "@/lib/auth/redirects";
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "我的发布",
  description: "OpenAA 我的发布管理页。",
  path: "/profile/posts",
  noIndex: true,
});

type ProfilePostsPageProps = {
  searchParams?: Promise<{ type?: string | string[]; subtype?: string | string[]; status?: string | string[]; tab?: string | string[] }>;
};

export default async function ProfilePostsPage({ searchParams }: ProfilePostsPageProps) {
  const params = await searchParams;
  const selectedPostType = normalizeProfilePostsType(firstParam(params?.type));
  const user = await getCurrentUser();

  if (!user) {
    redirectToAuthRequired(profilePostsHref(selectedPostType));
  }

  if (selectedPostType !== "all") {
    const config = postChannelConfig(selectedPostType);
    const filters = normalizeProfilePostFilters(selectedPostType, {
      type: params?.subtype,
      status: params?.status,
      tab: params?.tab,
    });
    const posts = await getMyPosts(selectedPostType);
    const visiblePosts = filterAndSortProfilePosts(posts.data, filters);

    return (
      <div className="space-y-4">
        <ProfileManagementPageHeader
          title={`我的${config.displayLabel}`}
          description={`管理您发布的${config.displayLabel}信息。`}
          actions={<ProfilePublishLink href={config.publishRoute} label={`+ 发布${config.displayLabel}`} />}
        />
        <ProfilePostFilters
          path="/profile/posts"
          typeParamName="subtype"
          preservedParams={{ type: profilePostsTypeParam(selectedPostType) }}
          typeOptions={buildProfilePostTypeOptions(selectedPostType)}
          statusOptions={buildProfilePostStatusOptions(posts.data)}
          selectedType={filters.selectedType}
          selectedStatus={filters.selectedStatus}
        />
        <ProfileUserPostsList key={`${selectedPostType}:${filters.selectedType}:${filters.selectedStatus}`} posts={visiblePosts} />
      </div>
    );
  }

  const posts = await getMyPosts();

  return (
    <div className="space-y-4">
      <ProfileManagementPageHeader title="我的发布" description="管理当前账号自己的招聘、房屋、二手和服务内容。" />
      <UserPostsList posts={posts.data} note={posts.state === "missing_config" ? "Supabase 环境变量尚未配置，当前显示空列表。" : undefined} />
    </div>
  );
}

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeProfilePostsType(value?: string): PostType | "all" {
  if (value === "jobs" || value === "job") return "job";
  if (value === "housing") return "housing";
  if (value === "marketplace") return "marketplace";
  if (value === "services" || value === "service") return "service";
  return "all";
}

function profilePostsTypeParam(postType: PostType) {
  if (postType === "job") return "jobs";
  if (postType === "service") return "services";
  return postType;
}

function profilePostsHref(postType: PostType | "all") {
  return postType === "all" ? "/profile/posts" : `/profile/posts?type=${profilePostsTypeParam(postType)}`;
}
