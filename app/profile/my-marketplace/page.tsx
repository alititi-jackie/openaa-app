import { PageShell } from "@/components/layout/PageShell";
import { PublishCta } from "@/components/posts/PublishCta";
import { UserSecondhandList } from "@/components/secondhand/UserSecondhandList";
import { getMyPosts } from "@/features/posts/queries";
import { redirectToAuthRequired } from "@/lib/auth/redirects";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "我的商品",
  description: "管理您发布的二手出售与求购信息。",
  path: "/profile/my-marketplace",
  noIndex: true,
});

export default async function ProfileMyMarketplacePage() {
  const user = await getCurrentUser();
  if (!user) redirectToAuthRequired("/profile/my-marketplace");

  const posts = await getMyPosts("marketplace");

  return (
    <PageShell title="我的商品" description="管理您发布的二手出售与求购信息" eyebrow="Profile" actions={<PublishCta returnTo="/secondhand" label="发布商品" />} keepActionsInline>
      <UserSecondhandList posts={posts.data} />
    </PageShell>
  );
}
