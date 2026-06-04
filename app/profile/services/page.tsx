import { PageShell } from "@/components/layout/PageShell";
import { UserPostsList } from "@/components/posts/UserPostsList";
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
    <PageShell title="我的服务" description="管理当前账号自己的本地服务内容。" eyebrow="Profile">
      <UserPostsList posts={posts.data} />
    </PageShell>
  );
}
