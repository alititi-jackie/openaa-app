import { PageShell } from "@/components/layout/PageShell";
import { PublishCta } from "@/components/posts/PublishCta";
import { UserHousingList } from "@/components/housing/UserHousingList";
import { getMyPosts } from "@/features/posts/queries";
import { redirectToAuthRequired } from "@/lib/auth/redirects";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "我的房屋",
  description: "管理您发布的房屋出租与求租信息。",
  path: "/profile/my-housing",
  noIndex: true,
});

export default async function ProfileMyHousingPage() {
  const user = await getCurrentUser();
  if (!user) redirectToAuthRequired("/profile/my-housing");

  const posts = await getMyPosts("housing");

  return (
    <PageShell
      title="我的房屋"
      description="管理您发布的房屋出租与求租信息"
      eyebrow="Profile"
      actions={<PublishCta returnTo="/housing" label="发布房源" />}
      keepActionsInline
    >
      <UserHousingList posts={posts.data} />
    </PageShell>
  );
}
