import Link from "next/link";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { TopQuickLinksManagement } from "@/components/admin/TopQuickLinksManagement";
import { NavigationAdminPermissions, NavigationLinkAdminList } from "@/components/navigation/NavigationAdminForm";
import { getAdminTopLinksData } from "@/features/admin-home/queries";
import { getAdminNavigationData } from "@/features/navigation/queries";
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
        const activeTab = normalizeNavigationTab(params?.tab);
        const [data, topLinksData] = await Promise.all([getAdminNavigationData(), getAdminTopLinksData()]);

        if (activeTab === "public" && !data.permissions.manageNavigation) {
          return (
            <div className="space-y-4">
              <AdminTopActions />

              <header className="bg-white">
                <h1 className="text-2xl font-black leading-tight text-slate-950">导航管理</h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  <NavigationAdminPermissions permissions={data.permissions} />
                  <AdminPermissionBadge allowed={topLinksData.permissions.manageTopLinks} label="manage_top_links" />
                </div>
              </header>
              <NavigationAdminTabs active={activeTab} />
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">当前管理员没有 manage_navigation 权限。</div>
            </div>
          );
        }

        if (activeTab === "top-links" && !topLinksData.permissions.manageTopLinks) {
          return (
            <div className="space-y-4">
              <AdminTopActions />

              <header className="bg-white">
                <h1 className="text-2xl font-black leading-tight text-slate-950">导航管理</h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  <NavigationAdminPermissions permissions={data.permissions} />
                  <AdminPermissionBadge allowed={topLinksData.permissions.manageTopLinks} label="manage_top_links" />
                </div>
              </header>
              <NavigationAdminTabs active={activeTab} />
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">当前管理员没有 manage_top_links 权限。</div>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <AdminTopActions />

            <header className="bg-white">
              <h1 className="text-2xl font-black leading-tight text-slate-950">导航管理</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <NavigationAdminPermissions permissions={data.permissions} />
                <AdminPermissionBadge allowed={topLinksData.permissions.manageTopLinks} label="manage_top_links" />
              </div>
            </header>

            <NavigationAdminTabs active={activeTab} />

            {activeTab === "public" && data.state === "error" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                导航后台读取暂时不可用：{data.error ?? "请稍后再试。"}
              </div>
            ) : null}

            {activeTab === "public" ? (
              <>
                <section className="bg-white">
                  <h2 className="text-lg font-black text-slate-950">网站列表</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">在对应分类里新增、编辑、显示、隐藏或删除网站。</p>
                  <Link href="/admin/recycle-bin?tab=navigation" className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
                    回收站
                  </Link>
                </section>

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
  const tabs = [
    { value: "public", label: "公共导航", href: "/admin/navigation?tab=public" },
    { value: "top-links", label: "顶部快捷导航", href: "/admin/navigation?tab=top-links" },
  ] as const;

  return (
    <nav aria-label="导航管理分类" className="max-w-full overflow-x-auto overflow-y-hidden whitespace-nowrap py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="inline-flex gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={tab.href}
            className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-black ring-1 ${
              active === tab.value ? "bg-slate-950 text-white ring-slate-950" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function normalizeNavigationTab(value?: string): "public" | "top-links" {
  return value === "top-links" ? "top-links" : "public";
}
