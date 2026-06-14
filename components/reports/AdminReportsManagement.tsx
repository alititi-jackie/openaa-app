import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { setAdminPostStatus } from "@/features/posts/adminActions";
import type { PostStatus } from "@/features/posts/types";
import { setAdminReportStatus } from "@/features/reports/adminActions";
import type { AdminReportListItem, AdminReportsPermissions } from "@/features/reports/adminQueries";
import { REPORT_REASON_LABELS } from "@/features/reports/adminQueries";

const postTypeOptions = [
  { value: "all", label: "全部频道" },
  { value: "jobs", label: "招聘" },
  { value: "housing", label: "房屋" },
  { value: "marketplace", label: "二手" },
  { value: "services", label: "服务" },
];

const reportStatusOptions = [
  { value: "all", label: "全部状态" },
  { value: "open", label: "未处理" },
  { value: "resolved", label: "已处理" },
  { value: "dismissed", label: "已驳回" },
];

const reportReasonOptions = [
  { value: "all", label: "全部原因" },
  ...Object.entries(REPORT_REASON_LABELS).map(([value, label]) => ({ value, label })),
];

const reportStatusTone = {
  open: "bg-amber-50 text-amber-700",
  in_review: "bg-blue-50 text-blue-700",
  resolved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-slate-100 text-slate-600",
};

const postStatusTone: Record<PostStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  pending_review: "bg-amber-50 text-amber-700",
  published: "bg-emerald-50 text-emerald-700",
  hidden: "bg-orange-50 text-orange-700",
  rejected: "bg-red-50 text-red-700",
  expired: "bg-slate-100 text-slate-600",
  deleted: "bg-red-50 text-red-700",
};

export function AdminReportsPermissionBadges({ permissions }: { permissions: AdminReportsPermissions }) {
  return (
    <>
      <AdminPermissionBadge allowed={permissions.viewReports} label="view_reports / view_post_reports" />
      <AdminPermissionBadge allowed={permissions.manageReports} label="handle_reports / handle_post_reports" />
      <AdminPermissionBadge allowed={permissions.moderatePosts} label="moderate_posts" />
    </>
  );
}

export function AdminReportsStats({ totals }: { totals: { total: number; open: number; processed: number } }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard icon={<FileText size={17} aria-hidden="true" />} label="举报总数" value={totals.total} />
      <StatCard icon={<AlertTriangle size={17} aria-hidden="true" />} label="未处理" value={totals.open} />
      <StatCard icon={<CheckCircle2 size={17} aria-hidden="true" />} label="已处理/驳回" value={totals.processed} />
    </div>
  );
}

export function AdminReportsFilter({ status, type, reason, q }: { status?: string; type?: string; reason?: string; q?: string }) {
  return (
    <form action="/admin/messages" className="grid gap-3 md:grid-cols-4">
      <input type="hidden" name="tab" value="reports" />
      <input
        name="q"
        defaultValue={q ?? ""}
        placeholder="搜索帖子、说明、作者或举报人"
        className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 md:col-span-4"
      />
      <select
        name="status"
        defaultValue={status ?? "all"}
        className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
      >
        {reportStatusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        name="type"
        defaultValue={type ?? "all"}
        className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
      >
        {postTypeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        name="reason"
        defaultValue={reason ?? "all"}
        className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
      >
        {reportReasonOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
        筛选举报
      </button>
    </form>
  );
}

export function AdminReportsList({ reports, permissions }: { reports: AdminReportListItem[]; permissions: AdminReportsPermissions }) {
  if (reports.length === 0) {
    return <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">暂无举报记录。</p>;
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <article key={report.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${reportStatusTone[report.status]}`}>{report.statusLabel}</span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">{report.postTypeLabel}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${postStatusTone[report.postStatus]}`}>{report.postStatusLabel}</span>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500">同帖举报 {report.reportCount}</span>
              </div>
              <h3 className="mt-2 line-clamp-2 font-black text-slate-950">{report.postTitle}</h3>
              <p className="mt-2 text-sm font-bold text-slate-700">原因：{report.reasonLabel}</p>
              {report.detail ? <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-600">{report.detail}</p> : null}
              <div className="mt-3 grid gap-1 break-all text-xs font-semibold text-slate-500">
                <span>举报人：{report.reporterLabel}</span>
                <span>作者：{report.authorLabel}</span>
                <span>举报时间：{formatDateTime(report.createdAt)}</span>
                <span>帖子 ID：{report.postId}</span>
              </div>
            </div>

            <div className="flex w-full flex-wrap gap-2 md:w-auto md:max-w-xs md:justify-end">
              {report.postStatus === "published" ? (
                <Link href={report.postHref} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-blue-700">
                  查看帖子
                </Link>
              ) : null}
              <Link href={`/admin/posts?q=${encodeURIComponent(report.postId)}`} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700">
                跳转帖子管理
              </Link>
              <ReportStatusActions report={report} permissions={permissions} />
              <PostModerationActions report={report} permissions={permissions} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function AdminReportsPagination({
  page,
  pageCount,
  totalCount,
  status,
  type,
  reason,
  q,
}: {
  page: number;
  pageCount: number;
  totalCount: number;
  status?: string;
  type?: string;
  reason?: string;
  q?: string;
}) {
  const previous = buildPageHref({ page: Math.max(1, page - 1), status, type, reason, q });
  const next = buildPageHref({ page: Math.min(pageCount, page + 1), status, type, reason, q });

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

function ReportStatusActions({ report, permissions }: { report: AdminReportListItem; permissions: AdminReportsPermissions }) {
  if (!permissions.manageReports) return null;

  return (
    <>
      {report.status !== "resolved" ? <ReportAction reportId={report.id} action="resolve" label="标记已处理" /> : null}
      {report.status !== "rejected" ? <ReportAction reportId={report.id} action="dismiss" label="驳回举报" /> : null}
      {report.status !== "open" ? <ReportAction reportId={report.id} action="reopen" label="重新打开" /> : null}
    </>
  );
}

function ReportAction({ reportId, action, label }: { reportId: string; action: string; label: string }) {
  return (
    <AdminActionForm action={setAdminReportStatus} submitLabel={label} className="contents">
      <input type="hidden" name="id" value={reportId} />
      <input type="hidden" name="action" value={action} />
    </AdminActionForm>
  );
}

function PostModerationActions({ report, permissions }: { report: AdminReportListItem; permissions: AdminReportsPermissions }) {
  if (!permissions.moderatePosts) return null;

  return (
    <>
      <PostStatusAction report={report} status="hidden" label="隐藏帖子" />
      <PostStatusAction report={report} status="published" label="恢复发布" />
      <PostStatusAction report={report} status="pending_review" label="标记待审" />
      <PostStatusAction report={report} status="deleted" label="软删除帖子" />
    </>
  );
}

function PostStatusAction({ report, status, label }: { report: AdminReportListItem; status: PostStatus; label: string }) {
  if (report.postStatus === status) return null;

  return (
    <AdminActionForm action={setAdminPostStatus} submitLabel={label} className="contents">
      <input type="hidden" name="id" value={report.postId} />
      <input type="hidden" name="status" value={status} />
    </AdminActionForm>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
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

function buildPageHref({ page, status, type, reason, q }: { page: number; status?: string; type?: string; reason?: string; q?: string }) {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (type && type !== "all") params.set("type", type);
  if (reason && reason !== "all") params.set("reason", reason);
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  params.set("tab", "reports");
  const query = params.toString();
  return `/admin/messages?${query}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未记录";
  return date.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
