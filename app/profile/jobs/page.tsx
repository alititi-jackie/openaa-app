import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { UserPostsList } from "@/components/posts/UserPostsList";
import { getMyPosts } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "我的招聘",
  description: "OpenAA 我的招聘发布管理页。",
  path: "/profile/jobs",
  noIndex: true,
});

export default async function ProfileJobsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?returnTo=/profile/jobs");
  }

  const posts = await getMyPosts("job");

  return (
    <PageShell title="我的招聘" description="管理当前账号自己的招聘内容。" eyebrow="Profile">
      <UserPostsList posts={posts.data} />
    </PageShell>
  );
}
