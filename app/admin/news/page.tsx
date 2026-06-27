import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { AdminActionGroup } from "@/components/admin/AdminActionGroup";
import { AdminAlert } from "@/components/admin/AdminAlert";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { NewsAdminManager, NewsAdminPermissions } from "@/components/news/NewsAdminForm";
import { getAdminNewsData } from "@/features/news/queries";
import { hasAdminModule } from "@/lib/permissions/admin";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "新闻管理",
  description: "OpenAA 后台新闻管理。",
  path: "/admin/news",
  noIndex: true,
});

export default function AdminNewsPage() {
  return (
    <AdminAuthGate>
      {async () => {
        if (!(await hasAdminModule("news"))) {
          return (
            <div className="space-y-4">
              <AdminTopActions />
              <AdminPageHeader title="新闻管理" description="管理新闻内容、分类、发布状态和回收站。" />
              <AdminAccessDenied title="无权限" message="当前管理员没有新闻管理模块权限。" permission="news" />
            </div>
          );
        }

        const data = await getAdminNewsData();
        const canRead = data.permissions.viewNews || data.permissions.createNews || data.permissions.editNews || data.permissions.publishNews || data.permissions.deleteNews;

        if (!canRead && !data.permissions.manageNewsCategories) {
          return (
            <div className="space-y-4">
              <AdminTopActions />
              <AdminPageHeader title="新闻管理" description="管理新闻内容、分类、发布状态和回收站。">
                <NewsAdminPermissions permissions={data.permissions} />
              </AdminPageHeader>
              <AdminAccessDenied title="无权限" message="当前管理员没有新闻管理相关权限。" permission="news" />
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <AdminActionGroup>
              <AdminTopActions />
              <AdminActionButton href="/admin/recycle-bin?tab=news">回收站</AdminActionButton>
            </AdminActionGroup>

            <AdminPageHeader title="新闻管理" description="管理新闻内容、分类、发布状态和回收站。">
              <NewsAdminPermissions permissions={data.permissions} />
            </AdminPageHeader>

            {data.state === "error" ? <AdminAlert>新闻后台读取暂时不可用：{data.error ?? "请稍后再试。"}</AdminAlert> : null}

            <NewsAdminManager posts={data.posts} categories={data.categories} categoryCounts={data.categoryCounts} permissions={data.permissions} />
          </div>
        );
      }}
    </AdminAuthGate>
  );
}
