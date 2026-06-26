import { FileText } from "lucide-react";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { AdminAlert } from "@/components/admin/AdminAlert";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminListCard } from "@/components/admin/AdminListCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { AdminPostsFilter, AdminPostsList, AdminPostsPagination, AdminPostsPermissionBadges, DailyPostLimitPanel } from "@/components/posts/AdminPostsManagement";
import { getAdminPermissionLabel } from "@/features/admins/adminRoleConfig";
import { getAdminPostNotificationTemplates, getAdminPostsData } from "@/features/posts/adminQueries";
import { getDailyPostLimitData } from "@/features/settings/adminQueries";
import type { PostStatus, PostType } from "@/features/posts/types";
import { hasAdminModule } from "@/lib/permissions/admin";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "用户发布信息管理",
  description: "OpenAA 后台用户发布信息管理。",
  path: "/admin/user-posts",
  noIndex: true,
});

type AdminUserPostsPageProps = {
  searchParams?: Promise<{ type?: string; status?: string; q?: string; author?: string; page?: string }>;
};

export default function AdminUserPostsPage({ searchParams }: AdminUserPostsPageProps) {
  return (
    <AdminAuthGate>
      {async () => {
        const params = await searchParams;

        if (!(await hasAdminModule("user-posts"))) {
          return (
            <div className="space-y-4">
              <AdminTopActions />
              <AdminPageHeader title="用户发布信息管理" description="统一管理用户发布的招聘、房屋、二手和本地服务信息。" />
              <AdminAccessDenied title="无权限" message="当前管理员没有用户发布信息管理模块权限。" permission="user-posts" />
            </div>
          );
        }

        const data = await getAdminPostsData({
          type: normalizeType(params?.type),
          status: normalizeStatus(params?.status),
          q: params?.q,
          authorId: params?.author,
          page: normalizePage(params?.page),
        });
        const canRead = data.permissions.viewPosts || data.permissions.moderatePosts;
        const templates = data.permissions.moderatePosts ? await getAdminPostNotificationTemplates() : [];
        const dailyPostLimit = await getDailyPostLimitData();

        if (!canRead) {
          return (
            <div className="space-y-4">
              <AdminTopActions />
              <AdminPageHeader title="用户发布信息管理" description="统一管理用户发布信息。">
                <AdminPostsPermissionBadges permissions={data.permissions} />
              </AdminPageHeader>
              <AdminAccessDenied title="无权限" message={`当前管理员没有 ${getAdminPermissionLabel("view_posts")} 或 ${getAdminPermissionLabel("moderate_posts")} 权限。`} permission="view_posts" />
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <AdminTopActions />
            <AdminPageHeader title="用户发布信息管理" description="统一管理用户发布的招聘、房屋、二手和本地服务信息。">
              <AdminPostsPermissionBadges permissions={data.permissions} />
            </AdminPageHeader>

            {data.state === "error" ? <AdminAlert>用户发布信息读取暂时不可用：{data.error ?? "请稍后再试。"}</AdminAlert> : null}

            {dailyPostLimit.state === "error" ? <AdminAlert>每日发布上限读取暂时不可用：{dailyPostLimit.error ?? "请稍后再试。"}</AdminAlert> : null}
            <DailyPostLimitPanel dailyPostLimit={dailyPostLimit.dailyPostLimit} canManage={data.permissions.moderatePosts} />

            <AdminFilterBar title="筛选用户发布信息" description="按类型、状态、标题、内容或作者快速筛选。">
              {params?.author ? <p className="mb-3 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">正在按作者筛选：{params.author}</p> : null}
              <AdminPostsFilter type={params?.type} status={params?.status} q={params?.q} author={params?.author} />
            </AdminFilterBar>

            <AdminListCard
              title="用户发布信息列表"
              description="支持审核、下架、恢复显示、审核拒绝和删除到回收站；永久删除只在回收站中处理。"
              meta={
                <>
                  <FileText size={15} aria-hidden="true" />
                  <span>默认按最近更新排序，每页显示 {data.pageSize} 条。</span>
                </>
              }
            >
              <AdminPostsList posts={data.posts} permissions={data.permissions} templates={templates} />
              <AdminPostsPagination page={data.page} pageCount={data.pageCount} totalCount={data.totalCount} type={params?.type} status={params?.status} q={params?.q} author={params?.author} />
            </AdminListCard>
          </div>
        );
      }}
    </AdminAuthGate>
  );
}

function normalizeType(value?: string): PostType | "all" | undefined {
  if (value === "jobs") return "job";
  if (value === "marketplace") return "marketplace";
  if (value === "services") return "service";
  if (value === "job" || value === "housing" || value === "marketplace" || value === "service") return value;
  if (value === "all") return "all";
  return undefined;
}

function normalizeStatus(value?: string): PostStatus | "all" | undefined {
  if (value === "pending_review" || value === "published" || value === "hidden" || value === "rejected") return value;
  if (value === "all") return "all";
  return undefined;
}

function normalizePage(value?: string) {
  if (!value) return 1;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1;
}
