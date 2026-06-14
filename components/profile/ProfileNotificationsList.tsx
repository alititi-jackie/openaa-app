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
      <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>通知 <span className="text-slate-950">{notifications.length}</span></span>
          <span className="text-slate-300">|</span>
          <span>未读 <span className={unreadCount > 0 ? "text-red-600" : "text-slate-950"}>{unreadCount}</span></span>
          <span className="text-slate-300">|</span>
          <span>已读 <span className="text-slate-950">{notifications.length - unreadCount}</span></span>
        </div>
      </div>

      {unreadCount > 0 ? (
        <form action={markAllNotificationsRead}>
          <button type="submit" className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 hover:bg-blue-100">
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
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <span className={notification.read_at ? "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500" : "rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700"}>
            {notification.read_at ? "已读" : "未读"}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{notificationTypeLabel(notification.type)}</span>
          <span className="text-xs font-bold text-slate-500">{formatDate(notification.created_at)}</span>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {!notification.read_at ? <NotificationReadForm id={notification.id} /> : null}
          <NotificationDeleteForm id={notification.id} />
        </div>
      </div>

      <h2 className="mt-3 text-base font-black text-slate-950">{notification.title}</h2>
      {notification.body ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{notification.body}</p> : null}

      {href ? (
        <Link href={href} className="mt-3 inline-flex items-center gap-1 text-sm font-black text-blue-700">
          查看详情
          <ExternalLink size={14} aria-hidden="true" />
        </Link>
      ) : null}
    </article>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "最新";
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

function notificationTypeLabel(type: string) {
  const labels: Record<string, string> = {
    system: "系统通知",
    announcement: "平台公告",
    account: "账号提醒",
    content: "内容通知",
    favorite: "收藏通知",
    dmv: "DMV 通知",
    moderation: "审核通知",
    recycle_bin: "回收站通知",
    content_issue: "内容问题",
    image_issue: "图片问题",
    contact_issue: "联系方式问题",
  };

  return labels[type] ?? "通知";
}
