import Link from "next/link";
import { Bell } from "lucide-react";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  AdminNotificationsFilter,
  AdminNotificationsList,
  AdminNotificationsPagination,
  AdminNotificationsPermissionBadges,
  AdminNotificationsStats,
} from "@/components/notifications/AdminNotificationsManagement";
import {
  getAdminNotificationsData,
  normalizeNotificationReadFilter,
  normalizeNotificationTypeFilter,
} from "@/features/notifications/adminQueries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "通知管理",
  description: "OpenAA 后台通知管理。",
  path: "/admin/notifications",
  noIndex: true,
});

type AdminNotificationsPageProps = {
  searchParams?: Promise<{ type?: string; read?: string; q?: string; page?: string }>;
};

export default function AdminNotificationsPage({ searchParams }: AdminNotificationsPageProps) {
  return (
    <AdminAuthGate>
      {async () => {
        const params = await searchParams;
        const data = await getAdminNotificationsData({
          type: normalizeNotificationTypeFilter(params?.type),
          read: normalizeNotificationReadFilter(params?.read),
          q: params?.q,
          page: normalizePage(params?.page),
        });

        if (!data.canManageNotifications) {
          return (
            <AdminPageHeader title="通知管理" description="当前管理员没有 manage_notifications 权限。">
              <AdminNotificationsPermissionBadges canManageNotifications={data.canManageNotifications} />
            </AdminPageHeader>
          );
        }

        return (
          <div className="space-y-4">
            <Link href="/admin/dashboard" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
              ← 返回总后台
            </Link>

            <AdminPageHeader title="通知管理" description="查看、筛选和删除已发送站内通知，确认用户已读状态。">
              <AdminNotificationsPermissionBadges canManageNotifications={data.canManageNotifications} />
            </AdminPageHeader>

            {data.state === "error" || data.state === "missing_config" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                通知后台读取暂时不可用：{data.error ?? "请稍后再试。"}
              </div>
            ) : null}

            <AdminNotificationsStats totals={data.totals} />

            <AdminCard title="筛选通知" description="按类型、已读状态、标题、内容或用户 ID 快速筛选通知。">
              <AdminNotificationsFilter type={params?.type} read={params?.read} q={params?.q} />
            </AdminCard>

            <AdminCard title="通知列表" description="删除通知只移除站内通知记录，不影响用户账号或其它内容。">
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                <Bell size={15} aria-hidden="true" />
                默认按最近创建排序，每页显示 {data.pageSize} 条。
              </div>
              <AdminNotificationsList notifications={data.notifications} />
              <AdminNotificationsPagination
                page={data.page}
                pageCount={data.pageCount}
                totalCount={data.totalCount}
                type={params?.type}
                read={params?.read}
                q={params?.q}
              />
            </AdminCard>
            <nav aria-label="后台底部导航" className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <Link href="/admin/dashboard" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
                  返回总后台
                </Link>
                <AdminLogoutButton />
              </div>
            </nav>

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
