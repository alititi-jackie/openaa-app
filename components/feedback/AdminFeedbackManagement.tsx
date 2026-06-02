import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { updateFeedbackNote, updateFeedbackStatus } from "@/features/feedback/actions";
import type { AdminFeedbackListItem, AdminFeedbackPermissions } from "@/features/feedback/adminQueries";
import { feedbackCategoryOptions, type FeedbackStatus } from "@/features/feedback/types";

const statusOptions: Array<{ value: FeedbackStatus | "all"; label: string }> = [
  { value: "all", label: "全部状态" },
  { value: "open", label: "待处理" },
  { value: "in_review", label: "处理中" },
  { value: "resolved", label: "已处理" },
  { value: "closed", label: "已关闭" },
];

const statusTone: Record<FeedbackStatus, string> = {
  open: "bg-amber-50 text-amber-700",
  in_review: "bg-blue-50 text-blue-700",
  resolved: "bg-emerald-50 text-emerald-700",
  closed: "bg-slate-100 text-slate-600",
};

export function AdminFeedbackPermissionBadges({ permissions }: { permissions: AdminFeedbackPermissions }) {
  return (
    <>
      <AdminPermissionBadge allowed={permissions.viewFeedback} label="view_feedback" />
      <AdminPermissionBadge allowed={permissions.handleFeedback} label="handle_feedback" />
    </>
  );
}

export function AdminFeedbackStats({ totals }: { totals: { total: number; open: number; processed: number } }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard label="反馈总数" value={totals.total} />
      <StatCard label="待处理" value={totals.open} />
      <StatCard label="已处理/关闭" value={totals.processed} />
    </div>
  );
}

export function AdminFeedbackFilter({ status, category, q }: { status?: string; category?: string; q?: string }) {
  return (
    <form action="/admin/feedback" className="grid gap-3 md:grid-cols-4">
      <input
        name="q"
        defaultValue={q ?? ""}
        placeholder="搜索标题、内容或邮箱"
        className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 md:col-span-4"
      />
      <select name="status" defaultValue={status ?? "all"} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500">
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select name="category" defaultValue={category ?? "all"} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 md:col-span-2">
        <option value="all">全部类型</option>
        {feedbackCategoryOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
        筛选反馈
      </button>
    </form>
  );
}

export function AdminFeedbackList({ feedback, permissions }: { feedback: AdminFeedbackListItem[]; permissions: AdminFeedbackPermissions }) {
  if (feedback.length === 0) {
    return <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">暂无反馈记录。</p>;
  }

  return (
    <div className="space-y-3">
      {feedback.map((item) => (
        <article key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusTone[item.status]}`}>{item.statusLabel}</span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">{item.categoryLabel}</span>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500">{formatDateTime(item.createdAt)}</span>
              </div>
              <h3 className="mt-2 line-clamp-2 font-black text-slate-950">{item.subject}</h3>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{item.message}</p>
              <div className="mt-3 grid gap-1 break-all text-xs font-semibold text-slate-500">
                <span>邮箱：{item.email || "未填写"}</span>
                <span>用户 ID：{item.userId || "匿名"}</span>
                <span>处理人：{item.handledBy || "未处理"} {item.handledAt ? `· ${formatDateTime(item.handledAt)}` : ""}</span>
              </div>
            </div>
            <MessageSquareText className="text-slate-300" size={22} aria-hidden="true" />
          </div>

          {permissions.handleFeedback ? (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <StatusAction item={item} status="in_review" label="标记处理中" />
                <StatusAction item={item} status="resolved" label="标记已处理" />
                <StatusAction item={item} status="closed" label="关闭反馈" />
                <StatusAction item={item} status="open" label="重新打开" />
              </div>
              <AdminActionForm action={updateFeedbackNote} submitLabel="保存备注">
                <input type="hidden" name="id" value={item.id} />
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  <span>后台备注</span>
                  <textarea
                    name="admin_note"
                    rows={2}
                    defaultValue={item.adminNote ?? ""}
                    placeholder="仅管理员可见"
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-900 outline-none focus:border-blue-500"
                  />
                </label>
              </AdminActionForm>
            </div>
          ) : item.adminNote ? (
            <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm leading-6 text-slate-600">后台备注：{item.adminNote}</p>
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
  category,
  q,
}: {
  page: number;
  pageCount: number;
  totalCount: number;
  status?: string;
  category?: string;
  q?: string;
}) {
  const previous = buildPageHref({ page: Math.max(1, page - 1), status, category, q });
  const next = buildPageHref({ page: Math.min(pageCount, page + 1), status, category, q });

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

function buildPageHref({ page, status, category, q }: { page: number; status?: string; category?: string; q?: string }) {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (category && category !== "all") params.set("category", category);
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/feedback?${query}` : "/admin/feedback";
}

function formatDateTime(value: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未记录";
  return date.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
