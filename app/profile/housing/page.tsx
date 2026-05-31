import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { UserPostsList } from "@/components/posts/UserPostsList";
import { getMyPosts } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "我的房屋",
  description: "OpenAA 我的房屋发布基础页。",
  path: "/profile/housing",
  noIndex: true,
});

export default async function ProfileHousingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?returnTo=/profile/housing");
  }

  const posts = await getMyPosts("housing");

  return (
    <PageShell title="我的房屋" description="只读显示当前账号自己的房屋内容。本阶段不开放编辑或发布管理。" eyebrow="Profile">
      <UserPostsList posts={posts.data} />
    </PageShell>
  );
}
