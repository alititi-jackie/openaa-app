import Link from "next/link";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { NewsAdminManager, NewsAdminPermissions } from "@/components/news/NewsAdminForm";
import { getAdminNewsData } from "@/features/news/queries";
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
        const data = await getAdminNewsData();
        const canRead = data.permissions.viewNews || data.permissions.createNews || data.permissions.editNews || data.permissions.publishNews || data.permissions.deleteNews;

        if (!canRead && !data.permissions.manageNewsCategories) {
          return (
            <div className="space-y-4">
              <header className="bg-white">
                <h1 className="text-2xl font-black leading-tight text-slate-950">新闻管理</h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  <NewsAdminPermissions permissions={data.permissions} />
                </div>
              </header>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">当前管理员没有新闻管理相关权限。</div>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/dashboard" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
                返回总后台
              </Link>
              <Link href="/admin/recycle-bin?tab=news" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
                回收站
              </Link>
            </div>

            <header className="bg-white">
              <h1 className="text-2xl font-black leading-tight text-slate-950">新闻管理</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <NewsAdminPermissions permissions={data.permissions} />
              </div>
            </header>

            {data.state === "error" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                新闻后台读取暂时不可用：{data.error ?? "请稍后再试。"}
              </div>
            ) : null}

            <NewsAdminManager posts={data.posts} categories={data.categories} permissions={data.permissions} />

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
