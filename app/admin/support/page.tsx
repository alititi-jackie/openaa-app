import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import {
  AdminSupportFilter,
  AdminSupportPagination,
  AdminSupportPermissionBadges,
  AdminSupportReloadLink,
  AdminSupportSettingsForm,
  AdminSupportStats,
  AdminSupportTicketsList,
} from "@/components/support/AdminSupportTicketsManagement";
import {
  getAdminSupportData,
  normalizeSupportPriorityFilter,
  normalizeSupportSort,
  normalizeSupportStatusFilter,
  normalizeSupportTypeFilter,
} from "@/features/support/adminQueries";
import { getAdminPermissionLabel } from "@/features/admins/adminRoleConfig";
import { hasAdminModule } from "@/lib/permissions/admin";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "反馈与举报管理",
  description: "OpenAA 后台反馈与举报工单管理。",
  path: "/admin/support",
  noIndex: true,
});

type AdminSupportPageProps = {
  searchParams?: Promise<{
    status?: string;
    type?: string;
    priority?: string;
    q?: string;
    sort?: string;
    page?: string;
  }>;
};

export default function AdminSupportPage({ searchParams }: AdminSupportPageProps) {
  return (
    <AdminAuthGate>
      {async () => {
        const params = await searchParams;
        if (!(await hasAdminModule("support"))) {
          return (
            <div className="space-y-4">
              <AdminTopActions />
              <AdminPageHeader title="反馈与举报管理" description="当前管理员没有反馈与举报管理模块权限。" />
            </div>
          );
        }

        const data = await getAdminSupportData({
          status: normalizeSupportStatusFilter(params?.status),
          type: normalizeSupportTypeFilter(params?.type),
          priority: normalizeSupportPriorityFilter(params?.priority),
          q: params?.q,
          sort: normalizeSupportSort(params?.sort),
          page: normalizePage(params?.page),
        });

        if (!data.permissions.viewSupportTickets) {
          return (
            <div className="space-y-4">
              <AdminTopActions />
              <AdminPageHeader
                title="反馈与举报管理"
                description={`当前管理员没有 ${getAdminPermissionLabel("view_support_tickets")} 或 ${getAdminPermissionLabel("handle_support_tickets")} 权限。`}
              >
                <AdminSupportPermissionBadges permissions={data.permissions} />
              </AdminPageHeader>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <AdminTopActions />

            <AdminPageHeader title="反馈与举报管理" description="集中处理用户反馈、页面问题、联系方式异常、诈骗线索、合作咨询和账号问题。">
              <AdminSupportPermissionBadges permissions={data.permissions} />
            </AdminPageHeader>

            {data.state === "error" || data.state === "missing_config" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                反馈与举报管理暂时不可用：{data.error ?? "请稍后再试。"}
              </div>
            ) : null}

            <AdminSupportStats totals={data.totals} />

            <AdminCard title="反馈设置" description="控制反馈与举报提交开关、每日提交上限和字段长度限制。">
              <AdminSupportSettingsForm settings={data.settings} permissions={data.permissions} />
            </AdminCard>

            <AdminCard title="筛选工单" description="按状态、类型、优先级、关键词和提交时间筛选反馈与举报工单。">
              <AdminSupportFilter status={params?.status} type={params?.type} priority={params?.priority} q={params?.q} sort={params?.sort} />
            </AdminCard>

            <AdminCard title="工单列表" description="展开单条工单可查看完整联系方式、回复用户、记录内部备注并更新处理状态。">
              <div className="mb-4">
                <AdminSupportReloadLink />
              </div>
              <AdminSupportTicketsList tickets={data.tickets} permissions={data.permissions} />
              <AdminSupportPagination
                page={data.page}
                pageCount={data.pageCount}
                totalCount={data.totalCount}
                status={params?.status}
                type={params?.type}
                priority={params?.priority}
                q={params?.q}
                sort={params?.sort}
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

