import { ScrollText } from "lucide-react";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  AdminAuditLogsFilter,
  AdminAuditLogsList,
  AdminAuditLogsPagination,
  AdminAuditLogsPermissionBadges,
  AdminAuditLogsStats,
} from "@/components/audit-logs/AdminAuditLogsManagement";
import { getAdminAuditLogsData } from "@/features/audit-logs/adminQueries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "审计日志",
  description: "OpenAA 后台审计日志查看。",
  path: "/admin/audit-logs",
  noIndex: true,
});

type AdminAuditLogsPageProps = {
  searchParams?: Promise<{ action?: string; entityType?: string; actorId?: string; entityId?: string; dateFrom?: string; dateTo?: string; scope?: string; q?: string; page?: string }>;
};

export default function AdminAuditLogsPage({ searchParams }: AdminAuditLogsPageProps) {
  return (
    <AdminAuthGate>
      {async () => {
        const params = await searchParams;
        const data = await getAdminAuditLogsData({
          action: params?.action,
          entityType: params?.entityType,
          actorId: params?.actorId,
          entityId: params?.entityId,
          dateFrom: params?.dateFrom,
          dateTo: params?.dateTo,
          scope: params?.scope,
          q: params?.q,
          page: normalizePage(params?.page),
        });

        if (!data.canViewAuditLogs) {
          return (
            <AdminPageHeader title="审计日志" description="当前管理员没有 view_admin_audit_logs 或 view_audit_logs 权限。">
              <AdminAuditLogsPermissionBadges canViewAuditLogs={data.canViewAuditLogs} />
            </AdminPageHeader>
          );
        }

        return (
          <div className="space-y-4">
            <AdminPageHeader title="审计日志" description="查看后台操作记录和关键实体变更，便于上线后追溯。">
              <AdminAuditLogsPermissionBadges canViewAuditLogs={data.canViewAuditLogs} />
            </AdminPageHeader>

            {data.state === "error" || data.state === "missing_config" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                审计日志读取暂时不可用：{data.error ?? "请稍后再试。"}
              </div>
            ) : null}

            <AdminAuditLogsStats totals={data.totals} />

            <AdminCard title="筛选审计日志" description="按操作、实体类型、实体 ID 或管理员 ID 快速筛选。">
              <AdminAuditLogsFilter
                action={params?.action}
                entityType={params?.entityType}
                actorId={params?.actorId}
                entityId={params?.entityId}
                dateFrom={params?.dateFrom}
                dateTo={params?.dateTo}
                scope={params?.scope}
                q={params?.q}
                actionOptions={data.actionOptions}
                entityTypeOptions={data.entityTypeOptions}
              />
            </AdminCard>

            <AdminCard title="日志列表" description="审计日志只读展示，不在本页提供删除或修改操作。">
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                <ScrollText size={15} aria-hidden="true" />
                默认按最近操作排序，每页显示 {data.pageSize} 条。
              </div>
              <AdminAuditLogsList logs={data.logs} />
              <AdminAuditLogsPagination
                page={data.page}
                pageCount={data.pageCount}
                totalCount={data.totalCount}
                action={params?.action}
                entityType={params?.entityType}
                actorId={params?.actorId}
                entityId={params?.entityId}
                dateFrom={params?.dateFrom}
                dateTo={params?.dateTo}
                scope={params?.scope}
                q={params?.q}
              />
            </AdminCard>
          </div>
        );
      }}
    </AdminAuthGate>
  );
}

function normalizePage(value?: string) {
  if (!value) return 1;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1;
}
