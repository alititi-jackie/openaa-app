import Link from "next/link";
import { Activity, FileJson, ListFilter, ScrollText } from "lucide-react";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import type { AdminAuditLogItem } from "@/features/audit-logs/adminQueries";

export function AdminAuditLogsPermissionBadges({ canViewAuditLogs }: { canViewAuditLogs: boolean }) {
  return <AdminPermissionBadge allowed={canViewAuditLogs} label="view_admin_audit_logs / view_audit_logs" />;
}

export function AdminAuditLogsStats({
  totals,
}: {
  totals: { total: number; currentPage: number; actionCount: number; entityTypeCount: number };
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <StatCard icon={<ScrollText size={17} aria-hidden="true" />} label="审计日志" value={totals.total} />
      <StatCard icon={<Activity size={17} aria-hidden="true" />} label="当前页" value={totals.currentPage} />
      <StatCard icon={<ListFilter size={17} aria-hidden="true" />} label="操作类型" value={totals.actionCount} />
      <StatCard icon={<FileJson size={17} aria-hidden="true" />} label="实体类型" value={totals.entityTypeCount} />
    </div>
  );
}

export function AdminAuditLogsFilter({
  action,
  entityType,
  q,
  actionOptions,
  entityTypeOptions,
}: {
  action?: string;
  entityType?: string;
  q?: string;
  actionOptions: string[];
  entityTypeOptions: string[];
}) {
  return (
    <form action="/admin/audit-logs" className="grid gap-3 md:grid-cols-4">
      <input
        name="q"
        defaultValue={q ?? ""}
        placeholder="搜索 action、entity、actor id"
        className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 md:col-span-4"
      />
      <select name="action" defaultValue={action ?? "all"} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500">
        <option value="all">全部操作</option>
        {actionOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <select name="entityType" defaultValue={entityType ?? "all"} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 md:col-span-2">
        <option value="all">全部实体</option>
        {entityTypeOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
        筛选日志
      </button>
    </form>
  );
}

export function AdminAuditLogsList({ logs }: { logs: AdminAuditLogItem[] }) {
  if (logs.length === 0) {
    return <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">暂无审计日志记录。</p>;
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <article key={log.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">{log.action}</span>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-700">{log.entityType}</span>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500">{formatDateTime(log.createdAt)}</span>
              </div>
              <div className="mt-3 grid gap-1 break-all text-xs font-semibold text-slate-500">
                <span>actor_id：{log.actorId ?? "未记录"}</span>
                <span>entity_id：{log.entityId ?? "未记录"}</span>
                <span>ip_hash：{log.hasIpHash ? "已记录 hash" : "未记录"}</span>
                <span>user_agent：{log.hasUserAgent ? "已记录" : "未记录"}</span>
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <JsonBlock title="Before" value={log.beforeData} />
                <JsonBlock title="After" value={log.afterData} />
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function AdminAuditLogsPagination({
  page,
  pageCount,
  totalCount,
  action,
  entityType,
  q,
}: {
  page: number;
  pageCount: number;
  totalCount: number;
  action?: string;
  entityType?: string;
  q?: string;
}) {
  const previous = buildPageHref({ page: Math.max(1, page - 1), action, entityType, q });
  const next = buildPageHref({ page: Math.min(pageCount, page + 1), action, entityType, q });

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

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div>
      <p className="mb-1 text-xs font-black uppercase tracking-wide text-slate-400">{title}</p>
      <pre className="max-h-60 overflow-auto rounded-xl bg-white px-3 py-2 text-xs leading-5 text-slate-700">
        {formatJson(value)}
      </pre>
    </div>
  );
}

function formatJson(value: unknown) {
  if (value === null || value === undefined) return "null";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未记录";
  return date.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function buildPageHref({ page, action, entityType, q }: { page: number; action?: string; entityType?: string; q?: string }) {
  const params = new URLSearchParams();
  if (action && action !== "all") params.set("action", action);
  if (entityType && entityType !== "all") params.set("entityType", entityType);
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/audit-logs?${query}` : "/admin/audit-logs";
}
