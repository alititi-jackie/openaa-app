import { FileText } from "lucide-react";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPostsFilter, AdminPostsList, AdminPostsPagination, AdminPostsPermissionBadges } from "@/components/posts/AdminPostsManagement";
import { getAdminPostsData } from "@/features/posts/adminQueries";
import type { PostStatus, PostType } from "@/features/posts/types";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "帖子管理",
  description: "OpenAA 后台用户帖子管理基础。",
  path: "/admin/posts",
  noIndex: true,
});

type AdminPostsPageProps = {
  searchParams?: Promise<{ type?: string; status?: string; q?: string; page?: string }>;
};

export default function AdminPostsPage({ searchParams }: AdminPostsPageProps) {
  return (
    <AdminAuthGate>
      {async () => {
        const params = await searchParams;
        const data = await getAdminPostsData({
          type: normalizeType(params?.type),
          status: normalizeStatus(params?.status),
          q: params?.q,
          page: normalizePage(params?.page),
        });
        const canRead = data.permissions.viewPosts || data.permissions.moderatePosts;

        if (!canRead) {
          return (
            <AdminPageHeader title="帖子管理" description="当前管理员没有 view_posts 或 moderate_posts 权限。">
              <AdminPostsPermissionBadges permissions={data.permissions} />
            </AdminPageHeader>
          );
        }

        return (
          <div className="space-y-4">
            <AdminPageHeader title="帖子管理" description="统一查看和管理招聘、房屋、二手和本地服务用户帖子。">
              <AdminPostsPermissionBadges permissions={data.permissions} />
            </AdminPageHeader>

            {data.state === "error" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                帖子后台读取暂时不可用：{data.error ?? "请稍后再试。"}
              </div>
            ) : null}

            <AdminCard title="筛选帖子" description="按频道、状态、标题或摘要快速筛选当前用户帖子。">
              <AdminPostsFilter type={params?.type} status={params?.status} q={params?.q} />
            </AdminCard>

            <AdminCard title="帖子列表" description="支持发布/恢复、下架、拒绝和软删除；不做物理删除。">
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                <FileText size={15} aria-hidden="true" />
                默认按最近更新排序，每页显示 {data.pageSize} 条。
              </div>
              <AdminPostsList posts={data.posts} permissions={data.permissions} />
              <AdminPostsPagination page={data.page} pageCount={data.pageCount} totalCount={data.totalCount} type={params?.type} status={params?.status} q={params?.q} />
            </AdminCard>
          </div>
        );
      }}
    </AdminAuthGate>
  );
}

function normalizeType(value?: string): PostType | "all" | undefined {
  if (value === "jobs") return "job";
  if (value === "services") return "service";
  if (value === "job" || value === "housing" || value === "marketplace" || value === "service") return value;
  if (value === "all") return "all";
  return undefined;
}

function normalizeStatus(value?: string): PostStatus | "all" | undefined {
  if (value === "draft" || value === "pending_review" || value === "published" || value === "hidden" || value === "rejected" || value === "expired" || value === "deleted") return value;
  if (value === "all") return "all";
  return undefined;
}

function normalizePage(value?: string) {
  if (!value) return 1;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1;
}
