import Link from "next/link";
import { MessageSquareText, RefreshCw } from "lucide-react";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { softDeleteFeedback, updateFeedbackNote, updateFeedbackSettings, updateFeedbackStatus } from "@/features/feedback/actions";
import type { AdminFeedbackListItem, AdminFeedbackPermissions, AdminFeedbackSettings } from "@/features/feedback/adminQueries";
import { feedbackTypeOptions, type FeedbackStatus } from "@/features/feedback/types";

const statusOptions: Array<{ value: FeedbackStatus | "all"; label: string }> = [
  { value: "all", label: "全部" },
  { value: "pending", label: "待处理" },
  { value: "processing", label: "处理中" },
  { value: "resolved", label: "已处理" },
  { value: "ignored", label: "忽略" },
];

const statusTone: Record<FeedbackStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  processing: "bg-blue-50 text-blue-700 ring-blue-200",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ignored: "bg-zinc-100 text-zinc-500 ring-zinc-200",
};

export function AdminFeedbackPermissionBadges({ permissions }: { permissions: AdminFeedbackPermissions }) {
  return (
    <>
      <AdminPermissionBadge allowed={permissions.viewFeedback} label="view_feedback" />
      <AdminPermissionBadge allowed={permissions.handleFeedback} label="handle_feedback" />
    </>
  );
}

export function AdminFeedbackStats({ totals }: { totals: { total: number; pending: number; processed: number } }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard label="反馈总数" value={totals.total} />
      <StatCard label="待处理" value={totals.pending} />
      <StatCard label="已处理/忽略" value={totals.processed} />
    </div>
  );
}

export function AdminFeedbackSettingsForm({ settings, permissions }: { settings: AdminFeedbackSettings; permissions: AdminFeedbackPermissions }) {
  return (
    <AdminActionForm action={updateFeedbackSettings} submitLabel="保存设置">
      <div>
        <h2 className="text-base font-black text-slate-950">反馈提交设置</h2>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">用于限制每天反馈提交数量，防止垃圾反馈或恶意刷提交。</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-bold text-slate-700">
          <span>单个用户 / 访客每日上限</span>
          <input
            name="user_daily_limit"
            type="number"
            min={1}
            max={1000}
            defaultValue={settings.userDailyLimit}
            disabled={!permissions.handleFeedback}
            className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-700">
          <span>全站每日反馈总上限</span>
          <input
            name="total_daily_limit"
            type="number"
            min={1}
            max={1000}
            defaultValue={settings.totalDailyLimit}
            disabled={!permissions.handleFeedback}
            className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/feedback" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
          <RefreshCw size={15} aria-hidden="true" />
          重新加载
        </Link>
      </div>
    </AdminActionForm>
  );
}

export function AdminFeedbackFilter({ status, type, q }: { status?: string; type?: string; q?: string }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <Link
            key={option.value}
            href={buildFilterHref({ status: option.value, type, q })}
            className={`rounded-full px-3 py-1.5 text-sm font-black ring-1 transition-colors ${
              (status ?? "all") === option.value ? "bg-blue-600 text-white ring-blue-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {option.label}
          </Link>
        ))}
        <Link href={buildFilterHref({ status, type, q, refresh: true })} className="ml-auto inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-black text-slate-600 ring-1 ring-slate-200 hover:bg-slate-200">
          <RefreshCw size={14} aria-hidden="true" />
          刷新
        </Link>
      </div>
      <form action="/admin/feedback" className="grid gap-3 md:grid-cols-4">
        <input type="hidden" name="status" value={status ?? "all"} />
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="搜索内容、联系方式或链接"
          className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 md:col-span-2"
        />
        <select name="type" defaultValue={type ?? "all"} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500">
          <option value="all">全部类型</option>
          {feedbackTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
          筛选反馈
        </button>
      </form>
    </div>
  );
}

export function AdminFeedbackList({ feedback, permissions }: { feedback: AdminFeedbackListItem[]; permissions: AdminFeedbackPermissions }) {
  if (feedback.length === 0) {
    return <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">暂无反馈记录。</p>;
  }

  return (
    <div className="space-y-4">
      {feedback.map((item) => (
        <article key={item.id} className="rounded-2xl border border-slate-100 bg-white p-4 ring-1 ring-slate-50">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-black ring-1 ${statusTone[item.status]}`}>{item.statusLabel}</span>
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-black text-slate-600 ring-1 ring-slate-200">{item.type}</span>
            <span className="ml-auto text-xs font-semibold text-slate-400">{formatDateTime(item.createdAt)}</span>
          </div>

          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">{item.content}</p>

          <div className="mt-3 space-y-1 break-all text-xs font-semibold text-slate-500">
            <p>
              联系方式：<span className="text-slate-700">{item.contact || "未填写"}</span>
            </p>
            {item.relatedUrl ? (
              <p>
                相关页面：{" "}
                <a href={item.relatedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                  打开相关页面
                </a>
              </p>
            ) : (
              <p>相关页面：未填写</p>
            )}
            <p>用户：{item.userId || item.visitorId || "未知"}</p>
            <p>
              处理人：{item.handledBy || "未处理"} {item.handledAt ? `· ${formatDateTime(item.handledAt)}` : ""}
            </p>
          </div>

          {permissions.handleFeedback ? (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <StatusAction item={item} status="processing" label="标记处理中" />
                <StatusAction item={item} status="resolved" label="标记已处理" />
                <StatusAction item={item} status="ignored" label="忽略" />
                <StatusAction item={item} status="pending" label="恢复待处理" />
                <AdminActionForm action={softDeleteFeedback} submitLabel="删除" className="contents">
                  <input type="hidden" name="id" value={item.id} />
                </AdminActionForm>
              </div>
              <AdminActionForm action={updateFeedbackNote} submitLabel="保存备注">
                <input type="hidden" name="id" value={item.id} />
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  <span>后台备注</span>
                  <textarea
                    name="admin_note"
                    rows={2}
                    defaultValue={item.adminNote ?? ""}
                    placeholder="输入备注（仅管理员可见）"
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-900 outline-none focus:border-blue-500"
                  />
                </label>
              </AdminActionForm>
            </div>
          ) : item.adminNote ? (
            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">后台备注：{item.adminNote}</p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

export function AdminFeedbackPagination({
  page,
  pageCount,
  totalCount,
  status,
  type,
  q,
}: {
  page: number;
  pageCount: number;
  totalCount: number;
  status?: string;
  type?: string;
  q?: string;
}) {
  const previous = buildPageHref({ page: Math.max(1, page - 1), status, type, q });
  const next = buildPageHref({ page: Math.min(pageCount, page + 1), status, type, q });

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

export function AdminFeedbackReadHint({ pageSize }: { pageSize: number }) {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
      <MessageSquareText size={15} aria-hidden="true" />
      默认按状态优先级排序，同一状态按最近提交排序，每页显示 {pageSize} 条。
    </div>
  );
}

function StatusAction({ item, status, label }: { item: AdminFeedbackListItem; status: FeedbackStatus; label: string }) {
  if (item.status === status) return null;
  return (
    <AdminActionForm action={updateFeedbackStatus} submitLabel={label} className="contents">
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="status" value={status} />
    </AdminActionForm>
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

function buildFilterHref({ status, type, q }: { status?: string; type?: string; q?: string; refresh?: boolean }) {
  return buildPageHref({ page: 1, status, type, q });
}

function buildPageHref({ page, status, type, q }: { page: number; status?: string; type?: string; q?: string }) {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (type && type !== "all") params.set("type", type);
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/feedback?${query}` : "/admin/feedback";
}

function formatDateTime(value: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未记录";
  return date.toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}
