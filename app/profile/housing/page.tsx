import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { UserPostsList } from "@/components/posts/UserPostsList";
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

export default async function ProfileHousingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirectToAuthRequired("/profile/housing");
  }

  const posts = await getMyPosts("housing");

  return (
    <PageShell
      title="我的房屋"
      description="管理当前账号自己的房屋内容。"
      eyebrow="Profile"
      actions={
        <Link
          href="/housing/publish"
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm"
        >
          发布房屋
        </Link>
      }
    >
      <UserPostsList posts={posts.data} />
    </PageShell>
  );
}
