import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, MessageCircle, UserRound } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { PageShell } from "@/components/layout/PageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "我的通知",
  description: "OpenAA 我的通知入口。",
  path: "/profile/notifications",
  noIndex: true,
});

export default async function ProfileNotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?returnTo=/profile/notifications");
  }

  return (
    <PageShell title="我的通知" description="通知中心入口已接入，系统通知会在后续通知批次中补齐。" eyebrow="Profile">
      <EmptyState
        icon={<Bell size={22} aria-hidden="true" />}
        title="通知中心后续接入"
        description="后续会在这里显示审核、举报处理、平台提醒等通知。当前不会显示假通知或占位消息。"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <ProfileLink href="/feedback" label="反馈/联系平台" icon={<MessageCircle size={18} aria-hidden="true" />} />
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
