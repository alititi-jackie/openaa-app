import Link from "next/link";
import { Compass } from "lucide-react";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminCard } from "@/components/admin/AdminCard";
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

type AdminNavigationPageProps = {
  searchParams?: Promise<{ categoryId?: string; q?: string }>;
};

export default function AdminNavigationPage({ searchParams }: AdminNavigationPageProps) {
  return (
    <AdminAuthGate>
      {async () => {
        const params = await searchParams;
        const data = await getAdminNavigationData({ categoryId: params?.categoryId, q: params?.q });

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

            <AdminCard title="筛选网站" description="按标题、URL 或分类快速筛选后台导航网站。">
              <form action="/admin/navigation" className="grid gap-3 md:grid-cols-3">
                <input
                  name="q"
                  defaultValue={params?.q ?? ""}
                  placeholder="搜索标题或 URL"
                  className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
                />
                <select
                  name="categoryId"
                  defaultValue={params?.categoryId ?? ""}
                  className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
                >
                  <option value="">全部分类</option>
                  {data.categories.flatMap((category) => (category.id ? [<option key={category.id} value={category.id}>{category.name}</option>] : []))}
                </select>
                <button type="submit" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-100">
                  <Compass size={16} aria-hidden="true" />
                  筛选
                </button>
              </form>
            </AdminCard>

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
