import Link from "next/link";
import { AdminCountPillBar, type AdminCountPillItem } from "@/components/admin/AdminCountPillBar";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import type { AdminAuditLogItem } from "@/features/audit-logs/adminQueries";

export function AdminAuditLogsPermissionBadges({ canViewAuditLogs }: { canViewAuditLogs: boolean }) {
  return <AdminPermissionBadge allowed={canViewAuditLogs} label="view_admin_audit_logs / view_audit_logs" />;
}

export function AdminAuditLogsStats({
  totals,
}: {
  totals: { total: number; currentPage: number; actionCount: number; entityTypeCount: number; filtered: number };
}) {
  const items: AdminCountPillItem[] = [
    { key: "total", label: "全部", count: totals.total, tone: "primary" },
    { key: "filtered", label: "当前筛选", count: totals.filtered },
    { key: "current-page", label: "本页", count: totals.currentPage },
    { key: "action-count", label: "操作类型", count: totals.actionCount },
    { key: "entity-type-count", label: "实体类型", count: totals.entityTypeCount },
  ];

  return <AdminCountPillBar items={items} />;
}

export function AdminAuditLogsFilter({
  action,
  entityType,
  actorId,
  entityId,
  dateFrom,
  dateTo,
  scope,
  q,
  actionOptions,
  entityTypeOptions,
}: {
  action?: string;
  entityType?: string;
  actorId?: string;
  entityId?: string;
  dateFrom?: string;
  dateTo?: string;
  scope?: string;
  q?: string;
  actionOptions: string[];
  entityTypeOptions: string[];
}) {
  const summary = auditFilterSummary({ action, entityType, actorId, entityId, dateFrom, dateTo, scope, q });

  return (
    <details className="group rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-950">筛选审计日志</p>
          <p className="mt-1 truncate text-xs font-semibold text-slate-500">{summary}</p>
        </div>
        <span className="inline-flex min-h-9 shrink-0 items-center rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-black text-white">
          <span className="group-open:hidden">展开</span>
          <span className="hidden group-open:inline">收起</span>
        </span>
      </summary>
      <form action="/admin/audit-logs" className="mt-3 grid gap-3 border-t border-slate-100 pt-3 md:grid-cols-4">
        <div className="grid gap-2 rounded-xl bg-slate-50 p-3 md:col-span-4">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">快捷范围</p>
          <div className="flex flex-wrap gap-2">
            {auditScopeOptions.map((option) => (
              <label key={option.value} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                <input type="radio" name="scope" value={option.value} defaultChecked={(scope ?? "all") === option.value} />
                {option.label}
              </label>
            ))}
          </div>
        </div>
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="搜索 action、entity_type、entity_id、actor UUID"
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
        <input name="actorId" defaultValue={actorId ?? ""} placeholder="管理员 user id" className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 md:col-span-2" />
        <input name="entityId" defaultValue={entityId ?? ""} placeholder="目标实体 ID" className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 md:col-span-2" />
        <label className="grid gap-1.5 text-xs font-black text-slate-500">
          <span>开始日期</span>
          <input name="dateFrom" type="date" defaultValue={dateFrom ?? ""} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500" />
        </label>
        <label className="grid gap-1.5 text-xs font-black text-slate-500">
          <span>结束日期</span>
          <input name="dateTo" type="date" defaultValue={dateTo ?? ""} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500" />
        </label>
        <button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
          筛选日志
        </button>
        <Link href="/admin/audit-logs" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">
          清空筛选
        </Link>
      </form>
    </details>
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
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">{log.action}</span>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-700">{log.entityType}</span>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500">{formatDateTime(log.createdAt)}</span>
            </div>
            <div className="mt-2 grid gap-1 text-xs font-semibold text-slate-500">
              <span className="truncate">管理员：{shortId(log.actorId)}</span>
              <span className="truncate">对象：{shortId(log.entityId)}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-500">{log.hasIpHash ? "IP 已记录" : "IP 未记录"}</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-500">{log.hasUserAgent ? "设备已记录" : "设备未记录"}</span>
            </div>
            <details className="mt-3 rounded-xl border border-slate-200 bg-white">
              <summary className="cursor-pointer px-3 py-2 text-xs font-black text-slate-600">展开详情</summary>
              <div className="grid gap-3 border-t border-slate-100 p-3">
                <div className="grid gap-1 break-all text-xs font-semibold text-slate-500">
                  <span>actor_id：{log.actorId ?? "未记录"}</span>
                  <span>entity_id：{log.entityId ?? "未记录"}</span>
                  <span>ip_hash：{log.hasIpHash ? "已记录 hash" : "未记录"}</span>
                  <span>user_agent：{log.hasUserAgent ? "已记录" : "未记录"}</span>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <JsonBlock title="Before" value={log.beforeData} />
                  <JsonBlock title="After" value={log.afterData} />
                </div>
              </div>
            </details>
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
  actorId,
  entityId,
  dateFrom,
  dateTo,
  scope,
  q,
}: {
  page: number;
  pageCount: number;
  totalCount: number;
  action?: string;
  entityType?: string;
  actorId?: string;
  entityId?: string;
  dateFrom?: string;
  dateTo?: string;
  scope?: string;
  q?: string;
}) {
  const previous = buildPageHref({ page: Math.max(1, page - 1), action, entityType, actorId, entityId, dateFrom, dateTo, scope, q });
  const next = buildPageHref({ page: Math.min(pageCount, page + 1), action, entityType, actorId, entityId, dateFrom, dateTo, scope, q });

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

function auditFilterSummary({
  action,
  entityType,
  actorId,
  entityId,
  dateFrom,
  dateTo,
  scope,
  q,
}: {
  action?: string;
  entityType?: string;
  actorId?: string;
  entityId?: string;
  dateFrom?: string;
  dateTo?: string;
  scope?: string;
  q?: string;
}) {
  const parts = [
    auditScopeOptions.find((option) => option.value === (scope ?? "all"))?.label ?? "全部",
    action && action !== "all" ? action : "",
    entityType && entityType !== "all" ? entityType : "",
    q ? `搜索：${q}` : "",
    actorId ? `管理员：${shortId(actorId)}` : "",
    entityId ? `对象：${shortId(entityId)}` : "",
    dateFrom || dateTo ? `${dateFrom || "开始"} 至 ${dateTo || "现在"}` : "",
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "全部日志";
}

function shortId(value: string | null | undefined) {
  if (!value) return "未记录";
  return value.length > 14 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value;
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

const auditScopeOptions = [
  { value: "all", label: "全部" },
  { value: "home_ops", label: "首页 / Banner / Ticker" },
  { value: "ads_ops", label: "广告" },
  { value: "content_ops", label: "内容管理" },
];

function buildPageHref({
  page,
  action,
  entityType,
  actorId,
  entityId,
  dateFrom,
  dateTo,
  scope,
  q,
}: {
  page: number;
  action?: string;
  entityType?: string;
  actorId?: string;
  entityId?: string;
  dateFrom?: string;
  dateTo?: string;
  scope?: string;
  q?: string;
}) {
  const params = new URLSearchParams();
  if (action && action !== "all") params.set("action", action);
  if (entityType && entityType !== "all") params.set("entityType", entityType);
  if (actorId) params.set("actorId", actorId);
  if (entityId) params.set("entityId", entityId);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  if (scope && scope !== "all") params.set("scope", scope);
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/audit-logs?${query}` : "/admin/audit-logs";
}
