import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminBackNavigation } from "@/components/admin/AdminBackNavigation";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { NavigationRecycleBinList } from "@/components/navigation/NavigationRecycleBinManagement";
import { OrphanFavoritesNotice, RecycleBinHealthSection, RecycleBinList, RecycleBinSettingsSection } from "@/components/posts/AdminRecycleBinManagement";
import { getAdminNavigationRecycleBinData } from "@/features/navigation/queries";
import { getRecycleBinData, type RecycleBinFilter } from "@/features/posts/adminQueries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "回收站",
  description: "OpenAA 后台统一回收站中心。",
  path: "/admin/recycle-bin",
  noIndex: true,
});

type RecycleBinResourceType = "post" | "news" | "navigation";

const resourceTabs: Array<{ value: RecycleBinResourceType; label: string }> = [
  { value: "post", label: "发布信息" },
  { value: "news", label: "新闻" },
  { value: "navigation", label: "公共导航" },
];

const postFilterTabs: Array<{ value: RecycleBinFilter; label: string }> = [
  { value: "all", label: "全部" },
  { value: "job", label: "招聘" },
  { value: "housing", label: "房屋" },
  { value: "marketplace", label: "二手" },
  { value: "service", label: "服务" },
  { value: "expired", label: "已超期" },
  { value: "with_images", label: "带图片" },
  { value: "image_error", label: "图片异常" },
];

type RecycleBinPageProps = {
  searchParams?: Promise<{ tab?: string; filter?: string }>;
};

export default function AdminRecycleBinPage({ searchParams }: RecycleBinPageProps) {
  return (
    <AdminAuthGate>
      {async () => {
        const params = await searchParams;
        if (params?.tab === "posts") {
          const query = new URLSearchParams({ tab: "post" });
          if (params.filter) query.set("filter", params.filter);
          redirect(`/admin/recycle-bin?${query.toString()}`);
        }
        const activeTab = normalizeResourceTab(params?.tab);
        const postFilter = activeTab === "post" ? normalizePostFilter(params?.filter) : "all";
        const postData = await getRecycleBinData(activeTab === "news" ? "news" : postFilter);

        if (!postData.superAdmin) {
          return (
            <div className="space-y-4">
              <AdminBackNavigation />
              <AdminPageHeader title="回收站" description="只有超级管理员可以访问回收站">
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

            <AdminPageHeader title="回收站" description="统一管理已删除的发布信息、新闻和公共导航内容。">
              <AdminPermissionBadge allowed={postData.superAdmin} label="super_admin" />
            </AdminPageHeader>

            <nav aria-label="回收站资源分类" className="max-w-full overflow-x-auto overflow-y-hidden whitespace-nowrap py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="inline-flex gap-2">
                {resourceTabs.map((tab) => (
                  <Link
                    key={tab.value}
                    href={tab.value === "post" ? "/admin/recycle-bin?tab=post" : `/admin/recycle-bin?tab=${tab.value}`}
                    className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-black ring-1 ${
                      activeTab === tab.value ? "bg-slate-950 text-white ring-slate-950" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>
            </nav>

            {activeTab === "post" ? (
              <>
                <nav aria-label="发布信息回收站筛选" className="max-w-full overflow-x-auto overflow-y-hidden whitespace-nowrap py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="inline-flex gap-2">
                    {postFilterTabs.map((tab) => (
                      <Link
                        key={tab.value}
                        href={tab.value === "all" ? "/admin/recycle-bin?tab=post" : `/admin/recycle-bin?tab=post&filter=${tab.value}`}
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
                <RecycleBinHealthSection health={postData.health} activeFilter={postData.filter} />
                <OrphanFavoritesNotice visible={postData.filter === "orphan_favorites"} count={postData.health.orphanFavoriteCount} />

                <AdminCard title="发布信息" description="恢复会先变为隐藏状态；永久删除后不可恢复。">
                  <RecycleBinList items={postData.items} />
                </AdminCard>
              </>
            ) : null}

            {activeTab === "news" ? (
              <>
                {postData.error ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">{postData.error}</div> : null}
                <AdminCard title="新闻" description="新闻恢复后进入 hidden 状态，不会直接发布。">
                  <RecycleBinList items={postData.items} />
                </AdminCard>
              </>
            ) : null}

            {activeTab === "navigation" ? (
              <>
                {navigationData?.state === "error" ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">{navigationData.error ?? "公共导航内容读取失败，请稍后再试。"}</div> : null}
                <AdminCard title="公共导航" description="只管理已软删除的网站；不做健康检查、删除设置或自动清理。">
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

function normalizePostFilter(value?: string): RecycleBinFilter {
  return value === "job" ||
    value === "housing" ||
    value === "marketplace" ||
    value === "service" ||
    value === "expired" ||
    value === "with_images" ||
    value === "image_error" ||
    value === "orphan_favorites"
    ? value
    : "all";
}
