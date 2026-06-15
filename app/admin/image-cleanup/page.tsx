import { Image as ImageIcon } from "lucide-react";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { RecycleBinResourceNav } from "@/components/admin/RecycleBinResourceNav";
import {
  AdminImageAssetsList,
  AdminImageCleanupFilter,
  AdminImageCleanupHealthSection,
  AdminImageCleanupPagination,
  AdminImageCleanupPermissionBadges,
} from "@/components/image-cleanup/AdminImageCleanupManagement";
import {
  getAdminImageCleanupData,
  normalizeImageCleanupFilter,
  normalizeImageSourceFilter,
} from "@/features/image-cleanup/adminQueries";
import { getAdminPermissionLabel } from "@/features/admins/adminRoleConfig";
import { hasAdminModule } from "@/lib/permissions/admin";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "图片清理工具",
  description: "OpenAA 后台图片资产清理工具。",
  path: "/admin/image-cleanup",
  noIndex: true,
});

type AdminImageCleanupPageProps = {
  searchParams?: Promise<{ filter?: string; source?: string; q?: string; page?: string }>;
};

export default function AdminImageCleanupPage({ searchParams }: AdminImageCleanupPageProps) {
  return (
    <AdminAuthGate>
      {async () => {
        const params = await searchParams;
        if (!(await hasAdminModule("recycle-bin"))) {
          return (
            <div className="space-y-4">
              <AdminTopActions />
              <AdminPageHeader title="图片清理工具" description="当前管理员没有回收站模块权限。" />
            </div>
          );
        }
        const activeFilter = normalizeImageCleanupFilter(params?.filter);
        const data = await getAdminImageCleanupData({
          filter: activeFilter,
          source: normalizeImageSourceFilter(params?.source),
          q: params?.q,
          page: normalizePage(params?.page),
        });
        const canView = data.permissions.viewImages || data.permissions.manageImageAssets;
        const canDelete = data.permissions.manageImageAssets;

        if (!canView) {
          return (
            <AdminPageHeader title="图片清理工具" description={`当前管理员没有 ${getAdminPermissionLabel("view_images")} 或 ${getAdminPermissionLabel("manage_image_assets")} 权限。`}>
              <AdminImageCleanupPermissionBadges permissions={data.permissions} />
            </AdminPageHeader>
          );
        }

        return (
          <div className="space-y-4">
            <AdminTopActions />

            <AdminPageHeader title="图片清理工具" description="扫描 image_assets 中疑似未使用的图片资产，展示引用状态和风险提示；确认后只标记删除，不物理删除文件。">
              <AdminImageCleanupPermissionBadges permissions={data.permissions} />
            </AdminPageHeader>

            <RecycleBinResourceNav active="image-cleanup" />

            {data.state === "error" || data.state === "missing_config" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                图片清理工具暂时不可用：{data.error ?? "请稍后再试。"}
              </div>
            ) : null}

            <AdminImageCleanupHealthSection totals={data.totals} activeFilter={activeFilter} />

            <AdminCard title="扫描图片资产" description="默认显示未绑定业务内容、也未被帖子图片引用的疑似未使用图片；使用中的图片只读展示。">
              <AdminImageCleanupFilter filter={params?.filter} source={params?.source} q={params?.q} />
            </AdminCard>

            <AdminCard title="图片资产列表" description="使用中的图片不会出现删除按钮。外部图片只标记资产记录，不删除远端原图。">
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                <ImageIcon size={15} aria-hidden="true" />
                默认按最近创建排序，每页显示 {data.pageSize} 条。
              </div>
              <AdminImageAssetsList assets={data.assets} canDelete={canDelete} />
              <AdminImageCleanupPagination
                page={data.page}
                pageCount={data.pageCount}
                totalCount={data.totalCount}
                filter={params?.filter}
                source={params?.source}
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
