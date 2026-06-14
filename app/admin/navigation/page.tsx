import Link from "next/link";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { NavigationAdminPermissions, NavigationLinkAdminList } from "@/components/navigation/NavigationAdminForm";
import { getAdminNavigationData } from "@/features/navigation/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "导航管理",
  description: "OpenAA 后台导航分类和网站管理。",
  path: "/admin/navigation",
  noIndex: true,
});

export default function AdminNavigationPage() {
  return (
    <AdminAuthGate>
      {async () => {
        const data = await getAdminNavigationData();

        if (!data.permissions.manageNavigation) {
          return (
            <div className="space-y-4">
              <header className="bg-white">
                <h1 className="text-2xl font-black leading-tight text-slate-950">导航管理</h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  <NavigationAdminPermissions permissions={data.permissions} />
                </div>
              </header>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">当前管理员没有 manage_navigation 权限。</div>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <header className="bg-white">
              <h1 className="text-2xl font-black leading-tight text-slate-950">导航管理</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <NavigationAdminPermissions permissions={data.permissions} />
              </div>
            </header>

            {data.state === "error" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                导航后台读取暂时不可用：{data.error ?? "请稍后再试。"}
              </div>
            ) : null}

            <section className="bg-white">
              <h2 className="text-lg font-black text-slate-950">网站列表</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">在对应分类里新增、编辑、显示、隐藏或删除网站。</p>
            </section>

            <NavigationLinkAdminList links={data.links} categories={data.categories} />

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
