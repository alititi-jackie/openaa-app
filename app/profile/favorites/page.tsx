import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark, FileText } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { PageShell } from "@/components/layout/PageShell";
import { PostCard } from "@/components/posts/PostCard";
import { getMyFavoritePosts } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "我的收藏",
  description: "OpenAA 我的收藏入口。",
  path: "/profile/favorites",
  noIndex: true,
});

export default async function ProfileFavoritesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?returnTo=/profile/favorites");
  }

  const posts = await getMyFavoritePosts();

  return (
    <PageShell title="我的收藏" description="查看你收藏的公开招聘、房屋、市场和服务信息。" eyebrow="Profile">
      {posts.state === "error" ? <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">收藏读取失败，请稍后再试。</p> : null}
      {posts.state === "missing_config" ? <p className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">Supabase 环境变量尚未配置，当前显示空列表。</p> : null}
      {posts.data.length > 0 ? (
        <section className="space-y-3">
          {posts.data.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </section>
      ) : (
        <EmptyState
          icon={<Bookmark size={22} aria-hidden="true" />}
          title="还没有收藏"
          description="在招聘、房屋、二手市场或本地服务详情页点击收藏后，会显示在这里。"
        />
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <ProfileLink href="/profile/posts" label="查看我的发布" icon={<FileText size={18} aria-hidden="true" />} />
        <ProfileLink href="/profile" label="返回我的" icon={<Bookmark size={18} aria-hidden="true" />} />
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
