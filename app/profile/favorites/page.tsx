import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark, FileText } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { PageShell } from "@/components/layout/PageShell";
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

  return (
    <PageShell title="我的收藏" description="收藏入口已接入，完整收藏列表会在后续收藏批次中补齐。" eyebrow="Profile">
      <EmptyState
        icon={<Bookmark size={22} aria-hidden="true" />}
        title="收藏列表后续接入"
        description="你已经可以在帖子详情页收藏内容。完整收藏列表会在后续批次接入，这里先保留用户中心入口，避免跳转到空路由。"
      />
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
