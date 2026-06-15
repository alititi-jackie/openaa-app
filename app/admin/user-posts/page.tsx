import { FileText } from "lucide-react";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPostsFilter, AdminPostsList, AdminPostsPagination, AdminPostsPermissionBadges } from "@/components/posts/AdminPostsManagement";
import { getAdminPostNotificationTemplates, getAdminPostsData } from "@/features/posts/adminQueries";
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
              <AdminPageHeader title="用户发布信息管理" description="当前管理员没有用户发布信息管理模块权限。" />
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

        if (!canRead) {
          return (
            <div className="space-y-4">
              <AdminTopActions />
              <AdminPageHeader title="用户发布信息管理" description="当前管理员没有 view_posts 或 moderate_posts 权限。">
                <AdminPostsPermissionBadges permissions={data.permissions} />
              </AdminPageHeader>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <AdminTopActions />
            <AdminPageHeader title="用户发布信息管理" description="统一管理用户发布的招聘、房屋、二手和本地服务信息。">
              <AdminPostsPermissionBadges permissions={data.permissions} />
            </AdminPageHeader>

            {data.state === "error" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                用户发布信息读取暂时不可用：{data.error ?? "请稍后再试。"}
              </div>
            ) : null}

            <AdminCard title="筛选用户发布信息" description="按类型、状态、标题、内容或作者快速筛选用户发布信息。">
              {params?.author ? <p className="mb-3 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">正在按作者筛选：{params.author}</p> : null}
              <AdminPostsFilter type={params?.type} status={params?.status} q={params?.q} author={params?.author} />
            </AdminCard>

            <AdminCard title="用户发布信息列表" description="支持审核、下架、恢复显示、审核拒绝和删除到回收站；永久删除只在回收站中处理。">
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                <FileText size={15} aria-hidden="true" />
                默认按最近更新排序，每页显示 {data.pageSize} 条。
              </div>
              <AdminPostsList posts={data.posts} permissions={data.permissions} templates={templates} />
              <AdminPostsPagination page={data.page} pageCount={data.pageCount} totalCount={data.totalCount} type={params?.type} status={params?.status} q={params?.q} author={params?.author} />
            </AdminCard>
          </div>
        );
      }}
    </AdminAuthGate>
  );
}

function normalizeType(value?: string): PostType | "all" | undefined {
  if (value === "jobs") return "job";
  if (value === "secondhand") return "marketplace";
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
