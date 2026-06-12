import Link from "next/link";
import { Newspaper } from "lucide-react";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { NewsAdminPermissions, NewsCategoryManager, NewsPostAdminList, NewsPostForm } from "@/components/news/NewsAdminForm";
import { getAdminNewsData } from "@/features/news/queries";
import type { NewsStatus } from "@/features/news/types";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "新闻管理",
  description: "OpenAA 后台新闻管理基础。",
  path: "/admin/news",
  noIndex: true,
});

type AdminNewsPageProps = {
  searchParams?: Promise<{ status?: string; categoryId?: string; q?: string }>;
};

export default function AdminNewsPage({ searchParams }: AdminNewsPageProps) {
  return (
    <AdminAuthGate>
      {async () => {
        const params = await searchParams;
        const data = await getAdminNewsData({
          status: normalizeStatus(params?.status),
          categoryId: params?.categoryId,
          q: params?.q,
        });
        const canRead = data.permissions.viewNews || data.permissions.createNews || data.permissions.editNews || data.permissions.publishNews || data.permissions.deleteNews;

        if (!canRead && !data.permissions.manageNewsCategories) {
          return (
            <AdminPageHeader title="新闻管理" description="当前管理员没有新闻管理相关权限。">
              <NewsAdminPermissions permissions={data.permissions} />
            </AdminPageHeader>
          );
        }

        return (
          <div className="space-y-4">
            <Link href="/admin/dashboard" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
              ← 返回总后台
            </Link>

            <AdminPageHeader title="新闻管理" description="管理新闻列表、草稿、发布状态、置顶、SEO 字段和基础分类。">
              <NewsAdminPermissions permissions={data.permissions} />
            </AdminPageHeader>

            {data.state === "error" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                新闻后台读取暂时不可用：{data.error ?? "请稍后再试。"}
              </div>
            ) : null}

            {canRead ? (
              <AdminCard title="筛选新闻" description="按标题、slug、状态或分类快速筛选当前新闻。">
                <form action="/admin/news" className="grid gap-3 md:grid-cols-3">
                  <input name="q" defaultValue={params?.q ?? ""} placeholder="搜索标题或 slug" className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500" />
                  <select name="status" defaultValue={params?.status ?? "all"} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500">
                    <option value="all">全部状态</option>
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                    <option value="hidden">hidden</option>
                    <option value="deleted">deleted</option>
                  </select>
                  <select name="categoryId" defaultValue={params?.categoryId ?? ""} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500">
                    <option value="">全部分类</option>
                    {data.categories.flatMap((category) => category.id ? [<option key={category.id} value={category.id}>{category.name}</option>] : [])}
                  </select>
                  <button type="submit" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white md:col-span-3">
                    <Newspaper size={16} aria-hidden="true" />
                    筛选
                  </button>
                </form>
              </AdminCard>
            ) : null}

            {data.permissions.createNews ? (
              <AdminCard title="新增新闻" description="正文暂用 textarea 保存；封面图片 URL 本阶段支持 https://img.openaa.com/。">
                <NewsPostForm categories={data.categories} canPublish={data.permissions.publishNews} />
              </AdminCard>
            ) : null}

            {canRead ? (
              <AdminCard title="新闻列表" description="支持保存草稿、发布、下架、软删除和置顶。">
                <NewsPostAdminList posts={data.posts} permissions={data.permissions} categories={data.categories} />
              </AdminCard>
            ) : null}

            <AdminCard title="新闻分类" description="维护新闻分类名称、slug、启用状态和排序。">
              <NewsCategoryManager categories={data.categories} canManage={data.permissions.manageNewsCategories} />
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

function normalizeStatus(value?: string): NewsStatus | "all" | undefined {
  if (value === "draft" || value === "published" || value === "hidden" || value === "deleted") return value;
  if (value === "all") return "all";
  return undefined;
}
