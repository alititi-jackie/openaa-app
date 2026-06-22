import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { AdminActionGroup } from "@/components/admin/AdminActionGroup";
import { AdminAlert } from "@/components/admin/AdminAlert";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { TopQuickLinksManagement } from "@/components/admin/TopQuickLinksManagement";
import { NavigationAdminPermissions, NavigationLinkAdminList } from "@/components/navigation/NavigationAdminForm";
import { HorizontalPillTabs } from "@/components/common/HorizontalPillTabs";
import { getAdminTopLinksData } from "@/features/admin-home/queries";
import { getAdminPermissionLabel } from "@/features/admins/adminRoleConfig";
import { getAdminNavigationData } from "@/features/navigation/queries";
import { hasAdminModule } from "@/lib/permissions/admin";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "导航管理",
  description: "OpenAA 后台导航分类和网站管理。",
  path: "/admin/navigation",
  noIndex: true,
});

type AdminNavigationPageProps = {
  searchParams?: Promise<{ tab?: string }>;
};

export default function AdminNavigationPage({ searchParams }: AdminNavigationPageProps) {
  return (
    <AdminAuthGate>
      {async () => {
        const params = await searchParams;

        if (!(await hasAdminModule("navigation"))) {
          return (
            <div className="space-y-4">
              <AdminTopActions />
              <AdminPageHeader title="导航管理" description="管理公共导航和顶部快捷入口。" />
              <AdminAccessDenied title="无权限" message="当前管理员没有导航管理模块权限。" permission="navigation" />
            </div>
          );
        }

        const activeTab = normalizeNavigationTab(params?.tab);
        const [data, topLinksData] = await Promise.all([getAdminNavigationData(), getAdminTopLinksData()]);

        const header = (
          <AdminPageHeader title="导航管理" description="管理公共导航和顶部快捷入口。">
            <NavigationAdminPermissions permissions={data.permissions} />
            <AdminPermissionBadge allowed={topLinksData.permissions.manageTopLinks} label="manage_top_links" />
          </AdminPageHeader>
        );

        if (activeTab === "public" && !data.permissions.manageNavigation) {
          return (
            <div className="space-y-4">
              <AdminTopActions />
              {header}
              <NavigationAdminTabs active={activeTab} />
              <AdminAccessDenied title="无权限" message={`当前管理员没有 ${getAdminPermissionLabel("manage_navigation")} 权限。`} permission="manage_navigation" />
            </div>
          );
        }

        if (activeTab === "top-links" && !topLinksData.permissions.manageTopLinks) {
          return (
            <div className="space-y-4">
              <AdminTopActions />
              {header}
              <NavigationAdminTabs active={activeTab} />
              <AdminAccessDenied title="无权限" message={`当前管理员没有 ${getAdminPermissionLabel("manage_top_links")} 权限。`} permission="manage_top_links" />
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <AdminTopActions />
            {header}
            <NavigationAdminTabs active={activeTab} />

            {activeTab === "public" && data.state === "error" ? <AdminAlert>导航后台读取暂时不可用：{data.error ?? "请稍后再试。"}</AdminAlert> : null}

            {activeTab === "public" ? (
              <>
                <AdminCard title="网站列表" description="在对应分类里新增、编辑、显示、隐藏或删除网站。">
                  <AdminActionGroup>
                    <AdminActionButton href="/admin/recycle-bin?tab=navigation">回收站</AdminActionButton>
                  </AdminActionGroup>
                </AdminCard>
                <NavigationLinkAdminList links={data.links} categories={data.categories} />
              </>
            ) : (
              <TopQuickLinksManagement topLinks={topLinksData.topLinks} />
            )}
          </div>
        );
      }}
    </AdminAuthGate>
  );
}

function NavigationAdminTabs({ active }: { active: "public" | "top-links" }) {
  return (
    <HorizontalPillTabs
      activeValue={active}
      ariaLabel="导航管理分类"
      tabs={[
        { value: "public", label: "公共导航", href: "/admin/navigation?tab=public" },
        { value: "top-links", label: "顶部快捷导航", href: "/admin/navigation?tab=top-links" },
      ]}
    />
  );
}

function normalizeNavigationTab(value?: string): "public" | "top-links" {
  return value === "top-links" ? "top-links" : "public";
}
