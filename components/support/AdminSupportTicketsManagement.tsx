import Link from "next/link";
import { RefreshCw, Settings2 } from "lucide-react";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { updateSupportTicket, updateSupportTicketSettings } from "@/features/support/adminActions";
import type { AdminSupportPermissions, AdminSupportTicketItem } from "@/features/support/adminQueries";
import {
  supportTicketPriorityOptions,
  supportTicketStatusOptions,
  supportTicketTypeOptions,
  type SupportTicketSettings,
} from "@/features/support/types";

const statusTone = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  processing: "bg-blue-50 text-blue-700 ring-blue-200",
  replied: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  closed: "bg-slate-100 text-slate-600 ring-slate-200",
};

const priorityTone = {
  low: "bg-slate-50 text-slate-600 ring-slate-200",
  normal: "bg-blue-50 text-blue-700 ring-blue-200",
  high: "bg-orange-50 text-orange-700 ring-orange-200",
  urgent: "bg-red-50 text-red-700 ring-red-200",
};

export function AdminSupportPermissionBadges({ permissions }: { permissions: AdminSupportPermissions }) {
  return (
    <>
      <AdminPermissionBadge allowed={permissions.viewSupportTickets} label="view_support_tickets" />
      <AdminPermissionBadge allowed={permissions.handleSupportTickets} label="handle_support_tickets" />
    </>
  );
}

export function AdminSupportStats({ totals }: { totals: { total: number; pending: number; processing: number; replied: number; closed: number } }) {
  return (
    <div className="grid gap-3 sm:grid-cols-5">
      <StatCard label="工单总数" value={totals.total} />
      <StatCard label="待处理" value={totals.pending} />
      <StatCard label="处理中" value={totals.processing} />
      <StatCard label="已回复" value={totals.replied} />
      <StatCard label="已关闭" value={totals.closed} />
    </div>
  );
}

export function AdminSupportSettingsForm({ settings, permissions }: { settings: SupportTicketSettings; permissions: AdminSupportPermissions }) {
  return (
    <AdminActionForm action={updateSupportTicketSettings} submitLabel="保存反馈设置">
      <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-500">
        <Settings2 size={15} aria-hidden="true" className="mt-0.5 shrink-0" />
        提交 API 会实时读取这些设置；设置缺失时才使用代码 fallback 默认值。
      </div>
      <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
        <input name="enabled" type="checkbox" defaultChecked={settings.enabled} disabled={!permissions.handleSupportTickets} className="h-4 w-4 rounded border-slate-300" />
        功能开启
      </label>
      <div className="grid gap-3 md:grid-cols-4">
        <NumberField label="登录用户每日上限" name="daily_user_limit" value={settings.dailyUserLimit} disabled={!permissions.handleSupportTickets} />
        <NumberField label="未登录访客每日上限" name="daily_visitor_limit" value={settings.dailyVisitorLimit} disabled={!permissions.handleSupportTickets} />
        <NumberField label="全站每日上限" name="daily_total_limit" value={settings.dailyTotalLimit} disabled={!permissions.handleSupportTickets} />
        <NumberField label="内容最少字数" name="content_min_length" value={settings.contentMinLength} disabled={!permissions.handleSupportTickets} />
        <NumberField label="内容最多字数" name="content_max_length" value={settings.contentMaxLength} disabled={!permissions.handleSupportTickets} />
        <NumberField label="联系方式最多字数" name="contact_max_length" value={settings.contactMaxLength} disabled={!permissions.handleSupportTickets} />
        <NumberField label="相关链接最多字数" name="related_url_max_length" value={settings.relatedUrlMaxLength} disabled={!permissions.handleSupportTickets} />
      </div>
    </AdminActionForm>
  );
}

export function AdminSupportFilter({
  status,
  type,
  priority,
  q,
  sort,
}: {
  status?: string;
  type?: string;
  priority?: string;
  q?: string;
  sort?: string;
}) {
  return (
    <form action="/admin/support" className="grid gap-3 md:grid-cols-5">
      <input
        name="q"
        defaultValue={q ?? ""}
        placeholder="搜索工单号、内容、联系方式、用户"
        className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 md:col-span-5"
      />
      <SelectField name="status" defaultValue={status ?? "all"} options={[{ value: "all", label: "全部状态" }, ...supportTicketStatusOptions]} />
      <SelectField name="type" defaultValue={type ?? "all"} options={[{ value: "all", label: "全部类型" }, ...supportTicketTypeOptions]} />
      <SelectField name="priority" defaultValue={priority ?? "all"} options={[{ value: "all", label: "全部优先级" }, ...supportTicketPriorityOptions]} />
      <SelectField name="sort" defaultValue={sort ?? "newest"} options={[{ value: "newest", label: "最新优先" }, { value: "oldest", label: "最早优先" }]} />
      <button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
        筛选工单
      </button>
    </form>
  );
}

export function AdminSupportTicketsList({ tickets, permissions }: { tickets: AdminSupportTicketItem[]; permissions: AdminSupportPermissions }) {
  if (tickets.length === 0) {
    return <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">暂无反馈与举报工单。</p>;
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <article key={ticket.id} className="rounded-2xl border border-slate-100 bg-white p-4 ring-1 ring-slate-50">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-950 px-2.5 py-0.5 text-xs font-black text-white">{ticket.ticketNo}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ring-1 ${statusTone[ticket.status]}`}>{ticket.statusLabel}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ring-1 ${priorityTone[ticket.priority]}`}>{ticket.priorityLabel}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-black text-slate-600 ring-1 ring-slate-200">{ticket.typeLabel}</span>
            <span className="ml-auto text-xs font-semibold text-slate-400">{formatDateTime(ticket.createdAt)}</span>
          </div>

          <p className="mt-3 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">{ticket.content}</p>

          <div className="mt-3 grid gap-1 break-all text-xs font-semibold text-slate-500 md:grid-cols-2">
            <Meta label="提交用户" value={ticket.profile ? profileLabel(ticket) : ticket.visitorId ? `访客 ${ticket.visitorId}` : "未知"} />
            <Meta label="本次联系方式" value={ticket.contactInfo || "未填写"} />
            <Meta label="账号联系方式" value={accountContactSummary(ticket)} />
            <Meta label="相关链接" value={ticket.relatedUrl || "未填写"} href={ticket.relatedUrl} />
          </div>

          <details className="mt-4 rounded-xl bg-slate-50 p-3">
            <summary className="cursor-pointer text-sm font-black text-slate-700">查看详情 / 处理工单</summary>
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <DetailBlock title="完整内容" value={ticket.content} />
                <DetailBlock title="关联信息" value={targetSummary(ticket)} />
                <DetailBlock title="本次填写联系方式" value={ticket.contactInfo || "未填写"} />
                <DetailBlock title="账号联系方式" value={accountContactDetails(ticket)} />
                <DetailBlock title="用户信息" value={userDetails(ticket)} />
                <DetailBlock title="处理记录" value={handledDetails(ticket)} />
              </div>

              {permissions.handleSupportTickets ? (
                <AdminActionForm action={updateSupportTicket} submitLabel="保存处理">
                  <input type="hidden" name="id" value={ticket.id} />
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                      <span>状态</span>
                      <select name="status" defaultValue={ticket.status} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500">
                        {supportTicketStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                      <span>优先级</span>
                      <select name="priority" defaultValue={ticket.priority} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500">
                        {supportTicketPriorityOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    <span>给用户看的回复</span>
                    <textarea name="admin_reply" rows={3} defaultValue={ticket.adminReply ?? ""} className="rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-900 outline-none focus:border-blue-500" />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    <span>后台内部备注</span>
                    <textarea name="admin_note" rows={3} defaultValue={ticket.adminNote ?? ""} className="rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-900 outline-none focus:border-blue-500" />
                  </label>
                </AdminActionForm>
              ) : (
                <p className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-500">当前账号只有查看权限，不能处理工单。</p>
              )}
            </div>
          </details>
        </article>
      ))}
    </div>
  );
}

export function AdminSupportPagination({
  page,
  pageCount,
  totalCount,
  status,
  type,
  priority,
  q,
  sort,
}: {
  page: number;
  pageCount: number;
  totalCount: number;
  status?: string;
  type?: string;
  priority?: string;
  q?: string;
  sort?: string;
}) {
  const previous = buildPageHref({ page: Math.max(1, page - 1), status, type, priority, q, sort });
  const next = buildPageHref({ page: Math.min(pageCount, page + 1), status, type, priority, q, sort });

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
      <span>
        共 {totalCount} 条 · 第 {page} / {pageCount} 页
      </span>
      <div className="flex flex-wrap gap-2">
        {page > 1 ? <Link href={previous} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-blue-700">上一页</Link> : null}
        {page < pageCount ? <Link href={next} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-blue-700">下一页</Link> : null}
      </div>
    </div>
  );
}

export function AdminSupportReloadLink() {
  return (
    <Link href="/admin/support" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
      <RefreshCw size={15} aria-hidden="true" />
      重新加载
    </Link>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function NumberField({ label, name, value, disabled }: { label: string; name: string; value: number; disabled?: boolean }) {
  return (
    <label className="grid gap-1.5 text-sm font-bold text-slate-700">
      <span>{label}</span>
      <input name={name} type="number" min={1} defaultValue={value} disabled={disabled} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400" />
    </label>
  );
}

function SelectField({ name, defaultValue, options }: { name: string; defaultValue: string; options: Array<{ value: string; label: string }> }) {
  return (
    <select name={name} defaultValue={defaultValue} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500">
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function Meta({ label, value, href }: { label: string; value: string; href?: string | null }) {
  return (
    <p>
      {label}：
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
          {value}
        </a>
      ) : (
        <span className="text-slate-700">{value}</span>
      )}
    </p>
  );
}

function DetailBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3">
      <p className="text-xs font-black text-slate-400">{title}</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function profileLabel(ticket: AdminSupportTicketItem) {
  if (ticket.profile?.nickname && ticket.profile.email) return `${ticket.profile.nickname} / ${ticket.profile.email}`;
  if (ticket.profile?.nickname) return ticket.profile.nickname;
  if (ticket.profile?.email) return ticket.profile.email;
  return ticket.userId ?? "未知用户";
}

function accountContactSummary(ticket: AdminSupportTicketItem) {
  const parts = [
    ticket.profile?.email ? `邮箱 ${ticket.profile.email}` : null,
    ticket.profile?.phone ? `手机 ${ticket.profile.phone}` : null,
    ticket.profile?.wechatId ? `微信 ${ticket.profile.wechatId}` : null,
    ticket.profile?.whatsapp ? `WhatsApp ${ticket.profile.whatsapp}` : null,
  ].filter(Boolean);
  return parts.join(" / ") || "未填写";
}

function accountContactDetails(ticket: AdminSupportTicketItem) {
  if (!ticket.profile) return "未登录用户，无账号联系方式。";
  return [
    `账号邮箱：${ticket.profile.email || "未填写"}`,
    `手机：${ticket.profile.phone || "未填写"}`,
    `微信：${ticket.profile.wechatId || "未填写"}`,
    `WhatsApp：${ticket.profile.whatsapp || "未填写"}`,
    `偏好联系方式：${ticket.profile.preferredContactMethod || "未填写"}`,
  ].join("\n");
}

function targetSummary(ticket: AdminSupportTicketItem) {
  return [
    `相关链接：${ticket.relatedUrl || "未填写"}`,
    `目标类型：${ticket.targetType || "未填写"}`,
    `目标 ID：${ticket.targetId || "未填写"}`,
    `来源：${ticket.source || "未填写"}`,
  ].join("\n");
}

function userDetails(ticket: AdminSupportTicketItem) {
  return [
    `昵称：${ticket.profile?.nickname || "未填写"}`,
    `用户 ID：${ticket.userId || "未登录"}`,
    `访客 ID：${ticket.visitorId || "无"}`,
  ].join("\n");
}

function handledDetails(ticket: AdminSupportTicketItem) {
  return [
    `处理人：${ticket.handledByLabel || ticket.handledBy || "未处理"}`,
    `处理时间：${formatDateTime(ticket.handledAt)}`,
    `关闭时间：${formatDateTime(ticket.closedAt)}`,
    `最后更新：${formatDateTime(ticket.updatedAt)}`,
  ].join("\n");
}

function buildPageHref({ page, status, type, priority, q, sort }: { page: number; status?: string; type?: string; priority?: string; q?: string; sort?: string }) {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (type && type !== "all") params.set("type", type);
  if (priority && priority !== "all") params.set("priority", priority);
  if (q) params.set("q", q);
  if (sort && sort !== "newest") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/support?${query}` : "/admin/support";
}

function formatDateTime(value: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未记录";
  return date.toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

