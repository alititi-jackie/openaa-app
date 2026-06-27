import Link from "next/link";
import { Clock, FileText, Search, UserRound } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { PublicStatusNotice } from "@/components/common/PublicStatusNotice";
import { PageShell } from "@/components/layout/PageShell";
import { PostCard } from "@/components/posts/PostCard";
import { getMyRecentPosts } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCurrentUser } from "@/lib/supabase/server";

import { redirectToAuthRequired } from "@/lib/auth/redirects";
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "最近浏览",
  description: "OpenAA 最近浏览入口。",
  path: "/profile/recent",
  noIndex: true,
});

export default async function ProfileRecentPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirectToAuthRequired("/profile/recent");
  }

  const posts = await getMyRecentPosts();

  return (
    <PageShell title="最近浏览" description="查看当前账号最近浏览过的公开信息。">
      {posts.state === "error" ? <PublicStatusNotice tone="error" className="p-3 font-bold">最近浏览读取失败，请稍后再试。</PublicStatusNotice> : null}
      {posts.state === "missing_config" ? <PublicStatusNotice className="p-3">Supabase 环境变量尚未配置，当前显示空列表。</PublicStatusNotice> : null}
      {posts.data.length > 0 ? (
        <section className="space-y-3">
          {posts.data.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </section>
      ) : (
        <EmptyState
          icon={<Clock size={22} aria-hidden="true" />}
          title="还没有最近浏览"
          description="登录后浏览招聘、房屋、二手市场或本地服务详情页，记录会显示在这里。"
        />
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <ProfileLink href="/jobs" label="浏览招聘" icon={<Search size={18} aria-hidden="true" />} />
        <ProfileLink href="/profile/posts" label="查看我的发布" icon={<FileText size={18} aria-hidden="true" />} />
        <ProfileLink href="/profile" label="返回我的" icon={<UserRound size={18} aria-hidden="true" />} />
      </div>
    </PageShell>
  );
}

function ProfileLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-900 shadow-sm"
    >
      {icon}
      {label}
    </Link>
  );
}
