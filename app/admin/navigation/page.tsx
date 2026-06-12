import Link from "next/link";
import { Compass } from "lucide-react";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { NavigationAdminPermissions, NavigationCategoryManager, NavigationLinkAdminList, NavigationLinkForm } from "@/components/navigation/NavigationAdminForm";
import { getAdminNavigationData } from "@/features/navigation/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "导航管理",
  description: "OpenAA 后台导航分类和链接管理。",
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
            <AdminPageHeader title="导航管理" description="当前管理员没有 manage_navigation 权限。">
              <NavigationAdminPermissions permissions={data.permissions} />
            </AdminPageHeader>
          );
        }

        return (
          <div className="space-y-4">
            <Link href="/admin/dashboard" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
              ← 返回总后台
            </Link>

            <AdminPageHeader title="导航管理" description="管理导航分类、链接、启用状态、推荐状态、排序、图标和图片。">
              <NavigationAdminPermissions permissions={data.permissions} />
            </AdminPageHeader>

            {data.state === "error" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                导航后台读取暂时不可用：{data.error ?? "请稍后再试。"}
              </div>
            ) : null}

            <AdminCard title="筛选导航" description="按标题、URL 或分类快速筛选后台导航链接。">
              <form action="/admin/navigation" className="grid gap-3 md:grid-cols-3">
                <input
                  name="q"
                  defaultValue={params?.q ?? ""}
                  placeholder="搜索标题或 URL"
                  className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
                />
                <select
                  name="categoryId"
                  defaultValue={params?.categoryId ?? ""}
                  className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
                >
                  <option value="">全部分类</option>
                  {data.categories.flatMap((category) => category.id ? [<option key={category.id} value={category.id}>{category.name}</option>] : [])}
                </select>
                <button type="submit" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
                  <Compass size={16} aria-hidden="true" />
                  筛选
                </button>
              </form>
            </AdminCard>

            <AdminCard title="新增导航链接" description="外部链接只允许 https；图片 URL 当前支持 https://img.openaa.com/。">
              <NavigationLinkForm categories={data.categories} />
            </AdminCard>

            <AdminCard title="导航链接列表" description="支持编辑、启用/停用、推荐/取消推荐和排序。">
              <NavigationLinkAdminList links={data.links} categories={data.categories} />
            </AdminCard>

            <AdminCard title="导航分类" description="维护导航分类名称、slug、图标、启用状态和排序。">
              <NavigationCategoryManager categories={data.categories} />
            </AdminCard>
            <nav aria-label="后台底部导航" className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <Link href="/" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
                  返回首页
                </Link>
                <Link href="/admin/dashboard" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
                  返回总后台
                </Link>
              </div>
            </nav>

          </div>
        );
      }}
    </AdminAuthGate>
  );
}
