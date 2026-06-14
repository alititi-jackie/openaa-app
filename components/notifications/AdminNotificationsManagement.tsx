import Link from "next/link";
import { Bell, CheckCircle2, MailWarning } from "lucide-react";
import { AdminActionForm, AdminSelect, AdminTextarea, AdminTextInput } from "@/components/admin/AdminActionForm";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { deleteAdminNotification, sendAdminNotification, sendBulkAdminNotification } from "@/features/notifications/adminActions";
import {
  notificationTypeOptions,
  type AdminNotificationListItem,
  type NotificationReadFilter,
} from "@/features/notifications/adminQueries";
import type { NotificationTemplate } from "@/features/notifications/service";

const readOptions: Array<{ value: NotificationReadFilter; label: string }> = [
  { value: "all", label: "全部状态" },
  { value: "unread", label: "未读" },
  { value: "read", label: "已读" },
];

const typeTone: Record<string, string> = {
  system: "bg-blue-50 text-blue-700",
  announcement: "bg-violet-50 text-violet-700",
  account: "bg-emerald-50 text-emerald-700",
  content: "bg-amber-50 text-amber-700",
  favorite: "bg-pink-50 text-pink-700",
  dmv: "bg-slate-100 text-slate-700",
};

export function AdminNotificationsPermissionBadges({ canManageNotifications }: { canManageNotifications: boolean }) {
  return <AdminPermissionBadge allowed={canManageNotifications} label="manage_notifications" />;
}

export function AdminNotificationsStats({ totals }: { totals: { total: number; unread: number; read: number } }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard icon={<Bell size={17} aria-hidden="true" />} label="通知总数" value={totals.total} />
      <StatCard icon={<MailWarning size={17} aria-hidden="true" />} label="未读" value={totals.unread} />
      <StatCard icon={<CheckCircle2 size={17} aria-hidden="true" />} label="已读" value={totals.read} />
    </div>
  );
}

export function AdminNotificationsFilter({ type, read, q }: { type?: string; read?: string; q?: string }) {
  return (
    <form action="/admin/messages" className="grid gap-3 md:grid-cols-4">
      <input type="hidden" name="tab" value="notifications" />
      <input
        name="q"
        defaultValue={q ?? ""}
        placeholder="搜索标题、内容或用户 ID"
        className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 md:col-span-4"
      />
      <select name="read" defaultValue={read ?? "all"} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500">
        {readOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select name="type" defaultValue={type ?? "all"} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 md:col-span-2">
        {notificationTypeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
        筛选通知
      </button>
    </form>
  );
}

export function AdminNotificationSendForms({
  templates,
  canSendBulkNotifications,
}: {
  templates: NotificationTemplate[];
  canSendBulkNotifications: boolean;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <AdminActionForm action={sendAdminNotification} submitLabel="发送通知">
        <NotificationTemplateSelect templates={templates} />
        <AdminSelect label="类型" name="type" defaultValue="system" options={notificationTypeOptions.filter((option) => option.value !== "all")} />
        <AdminTextInput label="用户 ID" name="user_id" required placeholder="用户 UUID" />
        <AdminTextInput label="标题（可覆盖模板）" name="title" placeholder="自定义标题" />
        <AdminTextarea label="正文（可覆盖模板）" name="body" rows={4} />
        <AdminTextInput label="跳转链接 action_url" name="action_url" placeholder="/profile/posts" />
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminTextInput label="target_type" name="target_type" placeholder="post" />
          <AdminTextInput label="target_id" name="target_id" placeholder="关联内容 ID" />
        </div>
      </AdminActionForm>

      {canSendBulkNotifications ? (
        <AdminActionForm action={sendBulkAdminNotification} submitLabel="群发通知">
          <NotificationTemplateSelect templates={templates} />
          <AdminSelect
            label="收件人"
            name="recipient_scope"
            defaultValue="active"
            options={[
              { value: "active", label: "全部 active 用户" },
              { value: "all", label: "全部用户" },
            ]}
          />
          <AdminSelect label="类型" name="type" defaultValue="system" options={notificationTypeOptions.filter((option) => option.value !== "all")} />
          <AdminTextInput label="标题（可覆盖模板）" name="title" placeholder="自定义标题" />
          <AdminTextarea label="正文（可覆盖模板）" name="body" rows={4} />
          <AdminTextInput label="跳转链接 action_url" name="action_url" placeholder="/profile/notifications" />
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminTextInput label="target_type" name="target_type" placeholder="announcement" />
            <AdminTextInput label="target_id" name="target_id" placeholder="可选关联 ID" />
          </div>
        </AdminActionForm>
      ) : (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">
          群发通知仅 super_admin 可用。当前账号仍可按用户发送通知。
        </div>
      )}
    </div>
  );
}

function NotificationTemplateSelect({ templates }: { templates: NotificationTemplate[] }) {
  return (
    <div className="space-y-3">
      <AdminSelect
        label="通知模板"
        name="template_key"
        defaultValue=""
        options={[
          { value: "", label: "不使用模板 / 自定义内容" },
          ...templates.map((template) => ({ value: template.key, label: `${template.key} · ${template.title}` })),
        ]}
      />
      {templates.length > 0 ? (
        <div className="grid gap-2">
          {templates.map((template) => (
            <details key={template.key} className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600 ring-1 ring-slate-100">
              <summary className="cursor-pointer font-black text-slate-800">{template.title}</summary>
              <p className="mt-2 whitespace-pre-wrap">{template.body}</p>
            </details>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AdminNotificationsList({ notifications }: { notifications: AdminNotificationListItem[] }) {
  if (notifications.length === 0) {
    return <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">暂无通知记录。</p>;
  }

  return (
    <div className="space-y-3">
      {notifications.map((item) => {
        const unread = !item.readAt;
        return (
          <article key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${typeTone[item.type] ?? "bg-slate-100 text-slate-700"}`}>{item.typeLabel}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${unread ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {unread ? "未读" : "已读"}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500">{formatDateTime(item.createdAt)}</span>
                </div>
                <h3 className="mt-2 line-clamp-2 font-black text-slate-950">{item.title}</h3>
                {item.body ? <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{item.body}</p> : null}
                <div className="mt-3 grid gap-1 break-all text-xs font-semibold text-slate-500">
                  <span>用户 ID：{item.userId}</span>
                  <span>已读时间：{item.readAt ? formatDateTime(item.readAt) : "未读"}</span>
                  <span>链接：{item.actionUrl || item.linkUrl || "无"}</span>
                </div>
              </div>
              <AdminActionForm action={deleteAdminNotification} submitLabel="删除通知" className="contents">
                <input type="hidden" name="id" value={item.id} />
              </AdminActionForm>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function AdminNotificationsPagination({
  page,
  pageCount,
  totalCount,
  type,
  read,
  q,
}: {
  page: number;
  pageCount: number;
  totalCount: number;
  type?: string;
  read?: string;
  q?: string;
}) {
  const previous = buildPageHref({ page: Math.max(1, page - 1), type, read, q });
  const next = buildPageHref({ page: Math.min(pageCount, page + 1), type, read, q });

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
      <span>
        共 {totalCount} 条 · 第 {page} / {pageCount} 页
      </span>
      <div className="flex flex-wrap gap-2">
        {page > 1 ? (
          <Link href={previous} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-blue-700">
            上一页
          </Link>
        ) : null}
        {page < pageCount ? (
          <Link href={next} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-blue-700">
            下一页
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-xs font-black text-slate-500">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-blue-700">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function buildPageHref({ page, type, read, q }: { page: number; type?: string; read?: string; q?: string }) {
  const params = new URLSearchParams();
  if (type && type !== "all") params.set("type", type);
  if (read && read !== "all") params.set("read", read);
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  params.set("tab", "notifications");
  const query = params.toString();
  return `/admin/messages?${query}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未记录";
  return date.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
