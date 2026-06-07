import { PublishCta } from "@/components/posts/PublishCta";
import { ProfileManagementPageHeader } from "@/components/profile/ProfileManagementPageHeader";
import { ProfileUserPostsList } from "@/components/profile/ProfileUserPostsList";
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

export default async function ProfileSecondhandPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirectToAuthRequired("/profile/secondhand");
  }

  const posts = await getMyPosts("marketplace");

  return (
    <div className="space-y-4">
      <ProfileManagementPageHeader
        title="我的商品"
        description="管理您发布的二手出售与求购信息"
        actions={<PublishCta returnTo="/secondhand" label="+ 发布商品" />}
      />
      <ProfileUserPostsList posts={posts.data} />
    </div>
  );
}
