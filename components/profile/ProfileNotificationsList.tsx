import Link from "next/link";
import { Bell, CheckCircle2, ExternalLink } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { markAllNotificationsRead } from "@/features/notifications/actions";
import type { NotificationListItem } from "@/features/notifications/queries";
import { NotificationDeleteForm, NotificationReadForm } from "./NotificationReadForm";

export function ProfileNotificationsList({ notifications }: { notifications: NotificationListItem[] }) {
  const unreadCount = notifications.filter((notification) => !notification.read_at).length;

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={<Bell size={22} aria-hidden="true" />}
        title="暂无通知"
        description="审核、举报处理、平台提醒等站内通知会显示在这里。当前不会显示假通知或占位消息。"
      />
    );
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="通知总数" value={notifications.length} />
        <StatCard label="未读" value={unreadCount} />
        <StatCard label="已读" value={notifications.length - unreadCount} />
      </div>

      {unreadCount > 0 ? (
        <form action={markAllNotificationsRead}>
          <button type="submit" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#1976d2] px-4 py-2 text-sm font-black text-white hover:bg-[#1565c0]">
            <CheckCircle2 size={16} aria-hidden="true" />
            全部标记已读
          </button>
        </form>
      ) : null}

      <div className="space-y-3">
        {notifications.map((notification) => (
          <NotificationCard key={notification.id} notification={notification} />
        ))}
      </div>
    </section>
  );
}

function NotificationCard({ notification }: { notification: NotificationListItem }) {
  const href = notification.action_url || notification.link_url;

  return (
    <article className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={notification.read_at ? "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600" : "rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700"}>
                    {notification.read_at ? "已读" : "未读"}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{notification.type}</span>
                  <span className="text-xs font-bold text-slate-500">{formatDate(notification.created_at)}</span>
                </div>
                <h2 className="mt-3 text-base font-black text-slate-950">{notification.title}</h2>
                {notification.body ? <p className="mt-2 text-sm leading-6 text-slate-600">{notification.body}</p> : null}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {!notification.read_at ? <NotificationReadForm id={notification.id} /> : null}
                <NotificationDeleteForm id={notification.id} />
              </div>
            </div>

            {href ? (
              <Link href={href} className="mt-3 inline-flex items-center gap-1 text-sm font-black text-blue-700">
                查看详情
                <ExternalLink size={14} aria-hidden="true" />
              </Link>
            ) : null}
          </article>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "最新";
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}
