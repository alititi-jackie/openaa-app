import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, FileText, Search } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { PageShell } from "@/components/layout/PageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCurrentUser } from "@/lib/supabase/server";

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
    redirect("/login?returnTo=/profile/recent");
  }

  return (
    <PageShell title="最近浏览" description="最近浏览入口已接入，浏览历史同步会在后续批次中补齐。" eyebrow="Profile">
      <EmptyState
        icon={<Clock size={22} aria-hidden="true" />}
        title="最近浏览后续接入"
        description="当前帖子详情页已有浏览统计，个人最近浏览列表会在后续收藏与浏览批次中补齐。"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <ProfileLink href="/jobs" label="浏览招聘" icon={<Search size={18} aria-hidden="true" />} />
        <ProfileLink href="/profile/posts" label="查看我的发布" icon={<FileText size={18} aria-hidden="true" />} />
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
