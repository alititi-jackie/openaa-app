import { AlertTriangle } from "lucide-react";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  AdminReportsFilter,
  AdminReportsList,
  AdminReportsPagination,
  AdminReportsPermissionBadges,
  AdminReportsStats,
} from "@/components/reports/AdminReportsManagement";
import { getAdminReportsData, type ReportFilterStatus, type ReportReason } from "@/features/reports/adminQueries";
import type { PostType } from "@/features/posts/types";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "举报管理",
  description: "OpenAA 后台帖子举报处理基础。",
  path: "/admin/reports",
  noIndex: true,
});

type AdminReportsPageProps = {
  searchParams?: Promise<{ status?: string; type?: string; reason?: string; q?: string; page?: string }>;
};

export default function AdminReportsPage({ searchParams }: AdminReportsPageProps) {
  return (
    <AdminAuthGate>
      {async () => {
        const params = await searchParams;
        const data = await getAdminReportsData({
          status: normalizeStatus(params?.status),
          type: normalizeType(params?.type),
          reason: normalizeReason(params?.reason),
          q: params?.q,
          page: normalizePage(params?.page),
        });

        if (!data.permissions.viewReports) {
          return (
            <AdminPageHeader title="举报管理" description="当前管理员没有 view_reports、view_post_reports 或 moderate_posts 权限。">
              <AdminReportsPermissionBadges permissions={data.permissions} />
            </AdminPageHeader>
          );
        }

        return (
          <div className="space-y-4">
            <AdminTopActions />
            <AdminPageHeader title="举报管理" description="统一查看、筛选和处理用户提交的帖子举报，并可联动帖子管理操作。">
              <AdminReportsPermissionBadges permissions={data.permissions} />
            </AdminPageHeader>

            {data.state === "error" || data.state === "missing_config" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                举报后台读取暂时不可用：{data.error ?? "请稍后再试。"}
              </div>
            ) : null}

            <AdminReportsStats totals={data.totals} />

            <AdminCard title="筛选举报" description="按处理状态、频道、举报原因、帖子标题、说明、作者或举报人快速筛选。">
              <AdminReportsFilter status={params?.status} type={params?.type} reason={params?.reason} q={params?.q} />
            </AdminCard>

            <AdminCard title="举报列表" description="举报不会自动下架帖子；管理员需要手动处理举报状态或联动帖子操作。">
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                <AlertTriangle size={15} aria-hidden="true" />
                默认按最近举报排序，每页显示 {data.pageSize} 条。
              </div>
              <AdminReportsList reports={data.reports} permissions={data.permissions} />
              <AdminReportsPagination
                page={data.page}
                pageCount={data.pageCount}
                totalCount={data.totalCount}
                status={params?.status}
                type={params?.type}
                reason={params?.reason}
                q={params?.q}
              />
            </AdminCard>
</div>
        );
      }}
    </AdminAuthGate>
  );
}

function normalizeStatus(value?: string): ReportFilterStatus | undefined {
  if (value === "open" || value === "resolved" || value === "dismissed" || value === "all") return value;
  if (value === "rejected") return "dismissed";
  return undefined;
}

function normalizeType(value?: string): PostType | "all" | undefined {
  if (value === "jobs") return "job";
  if (value === "services") return "service";
  if (value === "job" || value === "housing" || value === "marketplace" || value === "service") return value;
  if (value === "all") return "all";
  return undefined;
}

function normalizeReason(value?: string): ReportReason | "all" | undefined {
  if (value === "false_information" || value === "expired" || value === "scam" || value === "invalid_contact" || value === "illegal" || value === "other") return value;
  if (value === "all") return "all";
  return undefined;
}

function normalizePage(value?: string) {
  if (!value) return 1;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1;
}
