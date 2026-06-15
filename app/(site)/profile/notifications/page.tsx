import Link from "next/link";
import { MessageCircle, UserRound } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { ProfileNotificationsList } from "@/components/profile/ProfileNotificationsList";
import { getMyNotifications } from "@/features/notifications/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCurrentUser } from "@/lib/supabase/server";

import { redirectToAuthRequired } from "@/lib/auth/redirects";
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
    redirectToAuthRequired("/profile/notifications");
  }

  const notifications = await getMyNotifications();

  return (
    <PageShell title="我的通知" description="查看审核、举报处理和平台提醒等站内通知。">
      {notifications.state === "error" ? <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">通知读取失败，请稍后再试。</p> : null}
      {notifications.state === "missing_config" ? <p className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">Supabase 环境变量尚未配置，当前显示空列表。</p> : null}
      <ProfileNotificationsList notifications={notifications.data} />
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
