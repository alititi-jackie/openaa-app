import { PublishCta } from "@/components/posts/PublishCta";
import { ProfileManagementPageHeader } from "@/components/profile/ProfileManagementPageHeader";
import { ProfileUserPostsList } from "@/components/profile/ProfileUserPostsList";
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

export default async function ProfileServicesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirectToAuthRequired("/profile/services");
  }

  const posts = await getMyPosts("service");

  return (
    <div className="space-y-4">
      <ProfileManagementPageHeader
        title="我的服务"
        description="管理您发布的本地服务信息"
        actions={<PublishCta returnTo="/services" label="+ 发布服务" />}
      />
      <ProfileUserPostsList posts={posts.data} />
    </div>
  );
}
