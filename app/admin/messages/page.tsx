import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { AdminAlert } from "@/components/admin/AdminAlert";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { AdminMessageTabs, ContactUsersPanel, FeedbackPanel, ReportsPanel } from "@/components/messages/AdminMessagesManagement";
import { getAdminMessagesData, type FeedbackStatusTab, type MessageTab, type ReportStatusTab } from "@/features/messages/adminQueries";
import { isSupportTicketType, type SupportTicketType } from "@/features/support/types";
import { hasAdminModule } from "@/lib/permissions/admin";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "消息中心",
  description: "OpenAA 后台消息中心，集中处理举报、线索与建议和联系用户。",
  path: "/admin/messages",
  noIndex: true,
});

type AdminMessagesPageProps = {
  searchParams?: Promise<{
    tab?: string;
    reportStatus?: string;
    feedbackStatus?: string;
    feedbackType?: string;
    q?: string;
  }>;
};

export default function AdminMessagesPage({ searchParams }: AdminMessagesPageProps) {
  return (
    <AdminAuthGate>
      {async () => {
        const params = await searchParams;
        const canReadMessages = await hasAdminModule("messages");
        const activeTab = normalizeMessageTab(params?.tab);

        if (!canReadMessages) {
          return (
            <div className="space-y-4">
              <AdminTopActions />
              <AdminPageHeader title="消息中心" description="集中处理举报、线索与建议，并主动联系用户。" />
              <AdminAccessDenied title="无权限" message="当前管理员没有消息中心模块权限。" permission="messages" />
            </div>
          );
        }

        const data = await getAdminMessagesData({
          reportStatus: normalizeReportStatus(params?.reportStatus),
          feedbackStatus: normalizeFeedbackStatus(params?.feedbackStatus),
          feedbackType: normalizeFeedbackType(params?.feedbackType),
          q: params?.q ?? "",
        });

        return (
          <div className="space-y-4">
            <AdminTopActions />
            <AdminPageHeader title="消息中心" description="集中处理举报、线索与建议，并主动联系用户。">
              <AdminPermissionBadge allowed={canReadMessages} label="messages" />
            </AdminPageHeader>

            <AdminMessageTabs active={activeTab} counts={{ reports: data.reports.totals.open, feedback: data.feedback.totals.new }} />

            {data.state === "missing_config" || data.state === "error" ? <AdminAlert>消息中心暂时不可用：{data.error ?? "请稍后再试。"}</AdminAlert> : null}

            <AdminCard title={tabTitle(activeTab)} description={tabDescription(activeTab)}>
              {activeTab === "reports" ? <ReportsPanel data={data.reports} /> : null}
              {activeTab === "feedback" ? <FeedbackPanel data={data.feedback} /> : null}
              {activeTab === "contact-users" ? <ContactUsersPanel data={data.contactUsers} /> : null}
            </AdminCard>
          </div>
        );
      }}
    </AdminAuthGate>
  );
}

function normalizeMessageTab(value?: string): MessageTab {
  if (value === "feedback" || value === "contact-users") return value;
  return "reports";
}

function normalizeReportStatus(value?: string): ReportStatusTab {
  if (value === "resolved" || value === "deleted") return value;
  return "open";
}

function normalizeFeedbackStatus(value?: string): FeedbackStatusTab {
  if (value === "viewed" || value === "deleted") return value;
  return "new";
}

function normalizeFeedbackType(value?: string): SupportTicketType | "all" {
  if (value && isSupportTicketType(value)) return value;
  return "all";
}

function tabTitle(tab: MessageTab) {
  if (tab === "feedback") return "线索与建议";
  if (tab === "contact-users") return "联系用户";
  return "举报";
}

function tabDescription(tab: MessageTab) {
  if (tab === "feedback") return "查看用户提交的广告合作咨询、新闻线索、功能建议、其它问题和回复管理员。";
  if (tab === "contact-users") return "按用户名、登录邮箱或本站 ID 搜索用户，并发送站内联系消息。";
  return "处理用户对发布信息的举报，必要时下架或删除对应信息并通知作者。";
}
