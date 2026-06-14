import Link from "next/link";
import { AlertTriangle, Bell } from "lucide-react";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import {
  AdminFeedbackFilter,
  AdminFeedbackList,
  AdminFeedbackPagination,
  AdminFeedbackPermissionBadges,
  AdminFeedbackReadHint,
  AdminFeedbackSettingsForm,
  AdminFeedbackStats,
} from "@/components/feedback/AdminFeedbackManagement";
import {
  AdminNotificationsFilter,
  AdminNotificationsList,
  AdminNotificationsPagination,
  AdminNotificationsPermissionBadges,
  AdminNotificationSendForms,
  AdminNotificationsStats,
} from "@/components/notifications/AdminNotificationsManagement";
import {
  AdminReportsFilter,
  AdminReportsList,
  AdminReportsPagination,
  AdminReportsPermissionBadges,
  AdminReportsStats,
} from "@/components/reports/AdminReportsManagement";
import { getAdminFeedbackData, normalizeFeedbackStatus, normalizeFeedbackTypeFilter } from "@/features/feedback/adminQueries";
import {
  getAdminNotificationsData,
  normalizeNotificationReadFilter,
  normalizeNotificationTypeFilter,
} from "@/features/notifications/adminQueries";
import type { PostType } from "@/features/posts/types";
import { getAdminReportsData, type ReportFilterStatus, type ReportReason } from "@/features/reports/adminQueries";
import { hasAdminPermission, isSuperAdmin } from "@/lib/permissions/admin";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "消息中心",
  description: "OpenAA 后台消息中心。",
  path: "/admin/messages",
  noIndex: true,
});

type MessageTab = "feedback" | "reports" | "notifications";

type AdminMessagesPageProps = {
  searchParams?: Promise<{
    tab?: string;
    status?: string;
    type?: string;
    reason?: string;
    read?: string;
    q?: string;
    page?: string;
  }>;
};

const tabMeta: Record<MessageTab, { label: string; href: string }> = {
  feedback: { label: "反馈", href: "/admin/messages?tab=feedback" },
  reports: { label: "举报", href: "/admin/messages?tab=reports" },
  notifications: { label: "通知", href: "/admin/messages?tab=notifications" },
};

export default function AdminMessagesPage({ searchParams }: AdminMessagesPageProps) {
  return (
    <AdminAuthGate>
      {async () => {
        const params = await searchParams;
        const permissions = await getMessageCenterPermissions();
        const visibleTabs = getVisibleTabs(permissions);
        const requestedTab = normalizeMessageTab(params?.tab);
        const activeTab = requestedTab ?? visibleTabs[0] ?? "feedback";

        return (
          <div className="space-y-4">
            <AdminTopActions />

            <AdminPageHeader title="消息中心" description="集中处理用户反馈、内容举报和站内通知。">
              <AdminPermissionBadge allowed={permissions.canViewFeedback} label="view_feedback / handle_feedback" />
              <AdminPermissionBadge allowed={permissions.canViewReports} label="view_reports / handle_reports" />
              <AdminPermissionBadge allowed={permissions.canManageNotifications} label="manage_notifications" />
            </AdminPageHeader>

            {visibleTabs.length > 0 ? <MessagesTabNav active={activeTab} tabs={visibleTabs} /> : null}

            {visibleTabs.length === 0 ? (
              <NoPermissionPanel message="当前管理员没有消息中心权限。" />
            ) : !visibleTabs.includes(activeTab) ? (
              <NoPermissionPanel message="当前管理员没有查看该消息 tab 的权限。" />
            ) : activeTab === "feedback" ? (
              <FeedbackTab params={params} />
            ) : activeTab === "reports" ? (
              <ReportsTab params={params} />
            ) : (
              <NotificationsTab params={params} />
            )}
          </div>
        );
      }}
    </AdminAuthGate>
  );
}

async function FeedbackTab({ params }: { params?: Awaited<AdminMessagesPageProps["searchParams"]> }) {
  const data = await getAdminFeedbackData({
    status: normalizeFeedbackStatus(params?.status),
    type: normalizeFeedbackTypeFilter(params?.type),
    q: params?.q,
    page: normalizePage(params?.page),
  });

  if (!data.permissions.viewFeedback) {
    return (
      <NoPermissionPanel message="当前管理员没有 view_feedback 或 handle_feedback 权限。">
        <AdminFeedbackPermissionBadges permissions={data.permissions} />
      </NoPermissionPanel>
    );
  }

  return (
    <>
      {data.state === "error" || data.state === "missing_config" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          反馈后台读取暂时不可用：{data.error ?? "请稍后再试。"}
        </div>
      ) : null}

      <AdminFeedbackStats totals={data.totals} />

      <AdminCard title="提交设置" description="配置单个用户、匿名访客和全站每天允许提交的反馈数量。">
        <AdminFeedbackSettingsForm settings={data.settings} permissions={data.permissions} />
      </AdminCard>

      <AdminCard title="筛选反馈" description="按状态、类型、内容、联系方式或相关链接快速筛选反馈记录。">
        <AdminFeedbackFilter status={params?.status} type={params?.type} q={params?.q} />
      </AdminCard>

      <AdminCard title="反馈列表" description="删除反馈只会写入 deleted_at 软删除，不做物理删除，方便后续追溯。">
        <AdminFeedbackReadHint pageSize={data.pageSize} />
        <AdminFeedbackList feedback={data.feedback} permissions={data.permissions} />
        <AdminFeedbackPagination page={data.page} pageCount={data.pageCount} totalCount={data.totalCount} status={params?.status} type={params?.type} q={params?.q} />
      </AdminCard>
    </>
  );
}

async function ReportsTab({ params }: { params?: Awaited<AdminMessagesPageProps["searchParams"]> }) {
  const data = await getAdminReportsData({
    status: normalizeStatus(params?.status),
    type: normalizeType(params?.type),
    reason: normalizeReason(params?.reason),
    q: params?.q,
    page: normalizePage(params?.page),
  });

  if (!data.permissions.viewReports) {
    return (
      <NoPermissionPanel message="当前管理员没有 view_reports、handle_reports 或 moderate_posts 权限。">
        <AdminReportsPermissionBadges permissions={data.permissions} />
      </NoPermissionPanel>
    );
  }

  return (
    <>
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
    </>
  );
}

async function NotificationsTab({ params }: { params?: Awaited<AdminMessagesPageProps["searchParams"]> }) {
  const data = await getAdminNotificationsData({
    type: normalizeNotificationTypeFilter(params?.type),
    read: normalizeNotificationReadFilter(params?.read),
    q: params?.q,
    page: normalizePage(params?.page),
  });

  if (!data.canManageNotifications) {
    return (
      <NoPermissionPanel message="当前管理员没有 manage_notifications 权限。">
        <AdminNotificationsPermissionBadges canManageNotifications={data.canManageNotifications} />
      </NoPermissionPanel>
    );
  }

  return (
    <>
      {data.state === "error" || data.state === "missing_config" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          通知后台读取暂时不可用：{data.error ?? "请稍后再试。"}
        </div>
      ) : null}

      <AdminNotificationsStats totals={data.totals} />

      <AdminCard title="发送通知" description="按用户发送站内通知，super_admin 可进行简单群发。">
        <AdminNotificationSendForms templates={data.templates} canSendBulkNotifications={data.canSendBulkNotifications} />
      </AdminCard>

      <AdminCard title="筛选通知" description="按类型、已读状态、标题、内容或用户 ID 快速筛选通知。">
        <AdminNotificationsFilter type={params?.type} read={params?.read} q={params?.q} />
      </AdminCard>

      <AdminCard title="通知列表" description="删除通知只移除站内通知记录，不影响用户账号或其它内容。">
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
          <Bell size={15} aria-hidden="true" />
          默认按最近创建排序，每页显示 {data.pageSize} 条。
        </div>
        <AdminNotificationsList notifications={data.notifications} />
        <AdminNotificationsPagination page={data.page} pageCount={data.pageCount} totalCount={data.totalCount} type={params?.type} read={params?.read} q={params?.q} />
      </AdminCard>
    </>
  );
}

async function getMessageCenterPermissions() {
  const [superAdmin, viewFeedback, handleFeedback, viewReports, handleReports, viewPostReports, handlePostReports, moderatePosts, manageNotifications] =
    await Promise.all([
      isSuperAdmin(),
      hasAdminPermission("view_feedback"),
      hasAdminPermission("handle_feedback"),
      hasAdminPermission("view_reports"),
      hasAdminPermission("handle_reports"),
      hasAdminPermission("view_post_reports"),
      hasAdminPermission("handle_post_reports"),
      hasAdminPermission("moderate_posts"),
      hasAdminPermission("manage_notifications"),
    ]);

  return {
    canViewFeedback: superAdmin || viewFeedback || handleFeedback,
    canViewReports: superAdmin || viewReports || handleReports || viewPostReports || handlePostReports || moderatePosts,
    canManageNotifications: superAdmin || manageNotifications,
  };
}

function getVisibleTabs(permissions: Awaited<ReturnType<typeof getMessageCenterPermissions>>): MessageTab[] {
  return [
    permissions.canViewFeedback ? "feedback" : null,
    permissions.canViewReports ? "reports" : null,
    permissions.canManageNotifications ? "notifications" : null,
  ].filter((tab): tab is MessageTab => Boolean(tab));
}

function MessagesTabNav({ active, tabs }: { active: MessageTab; tabs: MessageTab[] }) {
  return (
    <nav aria-label="消息中心分类" className="max-w-full overflow-x-auto overflow-y-hidden whitespace-nowrap py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="inline-flex gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab}
            href={tabMeta[tab].href}
            className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-black ring-1 ${
              active === tab ? "bg-slate-950 text-white ring-slate-950" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {tabMeta[tab].label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function NoPermissionPanel({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <AdminCard title="无权限" description={message}>
      <div className="flex flex-wrap gap-2">{children}</div>
    </AdminCard>
  );
}

function normalizeMessageTab(value?: string): MessageTab | undefined {
  if (value === "feedback" || value === "reports" || value === "notifications") return value;
  return undefined;
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
