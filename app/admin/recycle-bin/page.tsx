import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminBackNavigation } from "@/components/admin/AdminBackNavigation";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { RecycleBinResourceNav } from "@/components/admin/RecycleBinResourceNav";
import { NavigationRecycleBinList } from "@/components/navigation/NavigationRecycleBinManagement";
import {
  OrphanFavoritesNotice,
  RecycleBinHealthSection,
  RecycleBinList,
  RecycleBinNewsHealthSection,
  RecycleBinNewsSettingsSection,
  RecycleBinSettingsSection,
} from "@/components/posts/AdminRecycleBinManagement";
import { NewsRecycleBinCategorySelect, PostRecycleBinTypeSelect } from "@/components/posts/RecycleBinFilterControls";
import { getAdminNavigationRecycleBinData } from "@/features/navigation/queries";
import { getNewsCategories } from "@/features/news/queries";
import { PUBLIC_POST_TYPES, POST_TYPE_LABELS } from "@/features/posts/constants";
import {
  getRecycleBinData,
  getRecycleBinNewsData,
  type RecycleBinFilter,
  type RecycleBinNewsFilter,
} from "@/features/posts/adminQueries";
import type { PostType } from "@/features/posts/types";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "回收站",
  description: "OpenAA 后台统一回收站中心。",
  path: "/admin/recycle-bin",
  noIndex: true,
});

type RecycleBinResourceType = "post" | "news" | "navigation";

const statusFilterTabs: Array<{ value: RecycleBinFilter; label: string }> = [
  { value: "all", label: "全部" },
  { value: "expired", label: "已超期" },
  { value: "with_images", label: "带图片" },
  { value: "image_error", label: "图片异常" },
];

const newsFilterTabs: Array<{ value: RecycleBinNewsFilter; label: string }> = [
  { value: "all", label: "全部" },
  { value: "expired", label: "已超期" },
  { value: "with_images", label: "带图片" },
  { value: "image_error", label: "图片异常" },
];

type RecycleBinPageProps = {
  searchParams?: Promise<{ tab?: string; filter?: string; type?: string; category?: string }>;
};

export default function AdminRecycleBinPage({ searchParams }: RecycleBinPageProps) {
  return (
    <AdminAuthGate>
      {async () => {
        const params = await searchParams;
        if (params?.tab === "posts") {
          const query = new URLSearchParams({ tab: "post" });
          if (params.type) query.set("type", params.type);
          if (params.category) query.set("category", params.category);
          if (params.filter) query.set("filter", params.filter);
          redirect(`/admin/recycle-bin?${query.toString()}`);
        }

        const activeTab = normalizeResourceTab(params?.tab);
        const postType = activeTab === "post" ? normalizePostType(params?.type) : "all";
        const postFilter = activeTab === "post" ? normalizePostFilter(params?.filter) : "all";
        const newsCategory = activeTab === "news" ? normalizeNewsCategory(params?.category) : "all";
        const newsFilter = activeTab === "news" ? normalizeNewsFilter(params?.filter) : "all";

        const postData = await getRecycleBinData(postFilter, postType);
        const newsCategoriesResult = activeTab === "news" ? await getNewsCategories() : null;
        const newsData = activeTab === "news" ? await getRecycleBinNewsData(newsFilter, newsCategory) : null;

        if (!postData.superAdmin) {
          return (
            <div className="space-y-4">
              <AdminBackNavigation />
              <AdminPageHeader title="回收站" description="只有超级管理员可以访问删除管理">
                <AdminPermissionBadge allowed={false} label="super_admin" />
              </AdminPageHeader>
            </div>
          );
        }

        const navigationData = activeTab === "navigation" ? await getAdminNavigationRecycleBinData("links") : null;

        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <AdminBackNavigation />
              <AdminLogoutButton />
            </div>

            <AdminPageHeader title="回收站" description="统一管理已删除的用户发布信息、新闻和公共导航内容。">
              <AdminPermissionBadge allowed={postData.superAdmin} label="super_admin" />
            </AdminPageHeader>

            <RecycleBinResourceNav active={activeTab} />

            {activeTab === "post" ? (
              <>
                <nav aria-label="用户发布信息回收站筛选" className="max-w-full overflow-x-auto overflow-y-hidden whitespace-nowrap py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="inline-flex gap-2">
                    <PostRecycleBinTypeSelect
                      value={postType}
                      filter={postData.filter}
                      options={PUBLIC_POST_TYPES.map((type) => ({ value: type, label: POST_TYPE_LABELS[type] }))}
                    />
                    {statusFilterTabs.map((tab) => (
                      <Link
                        key={tab.value}
                        href={postFilterHref(tab.value, postType)}
                        className={`inline-flex min-h-9 items-center justify-center rounded-xl px-3 py-2 text-xs font-black ring-1 ${
                          postData.filter === tab.value ? "bg-blue-50 text-blue-800 ring-blue-200" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {tab.label}
                      </Link>
                    ))}
                  </div>
                </nav>

                {postData.error ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">{postData.error}</div> : null}

                <RecycleBinSettingsSection settings={postData.retentionSettings} />
                <RecycleBinHealthSection health={postData.health} activeFilter={postData.filter} postType={postType} />
                <OrphanFavoritesNotice visible={postData.filter === "orphan_favorites"} count={postData.health.orphanFavoriteCount} />

                <AdminCard title="用户发布信息" description="恢复会先变为隐藏状态；永久删除后不可恢复。">
                  <RecycleBinList items={postData.items} />
                </AdminCard>
              </>
            ) : null}

            {activeTab === "news" ? (
              <>
                <nav aria-label="新闻回收站筛选" className="max-w-full overflow-x-auto overflow-y-hidden whitespace-nowrap py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="inline-flex gap-2">
                    <NewsRecycleBinCategorySelect value={newsCategory} filter={newsData?.filter ?? "all"} categories={newsCategoriesResult?.data ?? []} />
                    {newsFilterTabs.map((tab) => (
                      <Link
                        key={tab.value}
                        href={newsFilterHref(tab.value, newsCategory)}
                        className={`inline-flex min-h-9 items-center justify-center rounded-xl px-3 py-2 text-xs font-black ring-1 ${
                          newsData?.filter === tab.value ? "bg-blue-50 text-blue-800 ring-blue-200" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {tab.label}
                      </Link>
                    ))}
                  </div>
                </nav>

                {newsData?.error ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">{newsData.error}</div> : null}
                {newsData ? <RecycleBinNewsSettingsSection settings={newsData.retentionSettings} /> : null}
                {newsData ? <RecycleBinNewsHealthSection health={newsData.health} activeFilter={newsData.filter} category={newsCategory} /> : null}

                <AdminCard title="新闻" description="新闻恢复后进入 hidden 状态，不会直接发布。">
                  <RecycleBinList items={newsData?.items ?? []} />
                </AdminCard>
              </>
            ) : null}

            {activeTab === "navigation" ? (
              <>
                {navigationData?.state === "error" ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">{navigationData.error ?? "公共导航内容读取失败，请稍后再试。"}</div> : null}
                <AdminCard title="公共导航" description="只管理已软删除的网站；不做健康检查、图片管理或自动清理。">
                  <NavigationRecycleBinList links={navigationData?.links ?? []} kind="links" />
                </AdminCard>
              </>
            ) : null}
          </div>
        );
      }}
    </AdminAuthGate>
  );
}

function normalizeResourceTab(value?: string): RecycleBinResourceType {
  if (value === "news" || value === "navigation") return value;
  return "post";
}

function normalizePostType(value?: string): PostType | "all" {
  return PUBLIC_POST_TYPES.includes(value as PostType) ? (value as PostType) : "all";
}

function normalizePostFilter(value?: string): RecycleBinFilter {
  return value === "expired" || value === "with_images" || value === "image_error" || value === "orphan_favorites" ? value : "all";
}

function normalizeNewsFilter(value?: string): RecycleBinNewsFilter {
  return value === "expired" || value === "with_images" || value === "image_error" ? value : "all";
}

function normalizeNewsCategory(value?: string) {
  return value?.trim() || "all";
}

function postFilterHref(filter: RecycleBinFilter, postType: PostType | "all") {
  const params = new URLSearchParams({ tab: "post" });
  if (postType !== "all") params.set("type", postType);
  if (filter !== "all") params.set("filter", filter);
  return `/admin/recycle-bin?${params.toString()}`;
}

function newsFilterHref(filter: RecycleBinNewsFilter, category: string) {
  const params = new URLSearchParams({ tab: "news" });
  if (category !== "all") params.set("category", category);
  if (filter !== "all") params.set("filter", filter);
  return `/admin/recycle-bin?${params.toString()}`;
}
