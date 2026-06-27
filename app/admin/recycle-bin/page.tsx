import { redirect } from "next/navigation";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { AdminStatusTabs } from "@/components/admin/AdminStatusTabs";
import { RecycleBinResourceNav } from "@/components/admin/RecycleBinResourceNav";
import { AdminAdRecycleBinList } from "@/components/ads/AdminAdRecycleBin";
import { MessageRecycleBinList } from "@/components/messages/AdminMessageRecycleBin";
import { AdminNotificationRecycleBin } from "@/components/notifications/AdminNotificationRecycleBin";
import { NavigationRecycleBinList } from "@/components/navigation/NavigationRecycleBinManagement";
import {
  AdminImageAssetsList,
  AdminImageCleanupFilter,
  AdminImageCleanupHealthSection,
  AdminImageCleanupPagination,
  AdminImageCleanupPermissionBadges,
} from "@/components/image-cleanup/AdminImageCleanupManagement";
import {
  getAdminImageCleanupData,
  normalizeImageCleanupFilter,
  normalizeImageSourceFilter,
} from "@/features/image-cleanup/adminQueries";
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
import { getMessageRecycleData } from "@/features/messages/recycleQueries";
import { getAdminAdRecycleBinData } from "@/features/ads/adminQueries";
import { getDeletedNotificationsRecycleData } from "@/features/notifications/adminRecycleQueries";
import type { PostType } from "@/features/posts/types";
import { hasAdminModule } from "@/lib/permissions/admin";
import { getAdminPermissionLabel } from "@/features/admins/adminRoleConfig";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "回收站",
  description: "OpenAA 后台统一回收站中心。",
  path: "/admin/recycle-bin",
  noIndex: true,
});

type RecycleBinResourceType = "post" | "news" | "navigation" | "ads" | "reports" | "feedback" | "notifications" | "image-cleanup";

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
  searchParams?: Promise<{ tab?: string; filter?: string; type?: string; category?: string; source?: string; q?: string; page?: string }>;
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
        const imageFilter = activeTab === "image-cleanup" ? normalizeImageCleanupFilter(params?.filter) : "deletable";

        const canReadRecycleBin = await hasAdminModule("recycle-bin");
        const postData = await getRecycleBinData(postFilter, postType);
        const newsCategoriesResult = activeTab === "news" ? await getNewsCategories() : null;
        const newsData = activeTab === "news" ? await getRecycleBinNewsData(newsFilter, newsCategory) : null;
        const imageCleanupData = activeTab === "image-cleanup"
          ? await getAdminImageCleanupData({
              filter: imageFilter,
              source: normalizeImageSourceFilter(params?.source),
              q: params?.q,
              page: normalizePage(params?.page),
            })
          : null;

        if (!canReadRecycleBin) {
          return (
            <div className="space-y-4">
              <AdminTopActions />
              <AdminPageHeader title="回收站" description="当前管理员没有回收站模块权限。">
                <AdminPermissionBadge allowed={false} label="recycle-bin" />
              </AdminPageHeader>
            </div>
          );
        }

        const navigationData = activeTab === "navigation" ? await getAdminNavigationRecycleBinData("links") : null;
        const adRecycleData = activeTab === "ads" ? await getAdminAdRecycleBinData() : null;
        const messageRecycleData = activeTab === "reports" || activeTab === "feedback" ? await getMessageRecycleData(activeTab) : null;
        const notificationRecycleData = activeTab === "notifications" ? await getDeletedNotificationsRecycleData() : null;
        const canViewImages = Boolean(imageCleanupData && (imageCleanupData.permissions.viewImages || imageCleanupData.permissions.manageImageAssets));
        const canDeleteImages = Boolean(imageCleanupData?.permissions.manageImageAssets);

        return (
          <div className="space-y-4">
            <AdminTopActions />

            <AdminPageHeader title="回收站" description="统一管理已删除的用户发布信息、新闻和公共导航内容。">
              <AdminPermissionBadge allowed={canReadRecycleBin} label="recycle-bin" />
              <AdminPermissionBadge allowed={postData.superAdmin} label="超级管理员" />
            </AdminPageHeader>

            <RecycleBinResourceNav active={activeTab} />

            {activeTab === "post" ? (
              <>
                <AdminStatusTabs
                  ariaLabel="用户发布信息回收站筛选"
                  tabs={statusFilterTabs.map((tab) => ({ ...tab, href: postFilterHref(tab.value, postType) }))}
                  activeValue={postData.filter}
                  size="sm"
                  listClassName="items-center"
                  renderStart={
                    <PostRecycleBinTypeSelect
                      value={postType}
                      filter={postData.filter}
                      options={PUBLIC_POST_TYPES.map((type) => ({ value: type, label: POST_TYPE_LABELS[type] }))}
                    />
                  }
                />

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
                <AdminStatusTabs
                  ariaLabel="新闻回收站筛选"
                  tabs={newsFilterTabs.map((tab) => ({ ...tab, href: newsFilterHref(tab.value, newsCategory) }))}
                  activeValue={newsData?.filter ?? "all"}
                  size="sm"
                  listClassName="items-center"
                  renderStart={<NewsRecycleBinCategorySelect value={newsCategory} filter={newsData?.filter ?? "all"} categories={newsCategoriesResult?.data ?? []} />}
                />

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
                <AdminCard title="公共导航" description="只管理已删除的网站；不做健康检查、图片管理或自动清理。">
                  <NavigationRecycleBinList links={navigationData?.links ?? []} kind="links" />
                </AdminCard>
              </>
            ) : null}

            {activeTab === "ads" ? (
              <>
                {adRecycleData?.state === "error" || adRecycleData?.state === "missing_config" ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
                    {adRecycleData.error ?? "已删除广告读取失败，请稍后再试。"}
                  </div>
                ) : null}
                <AdminCard title="已删除广告" description="恢复后广告会保持停用状态；永久删除后，广告图片会进入图片清理工具继续处理。">
                  <AdminAdRecycleBinList items={adRecycleData?.items ?? []} />
                </AdminCard>
              </>
            ) : null}

            {activeTab === "reports" || activeTab === "feedback" ? (
              <>
                {messageRecycleData?.state === "error" || messageRecycleData?.state === "missing_config" ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
                    {messageRecycleData.error ?? "回收站内容读取失败，请稍后再试。"}
                  </div>
                ) : null}
                <AdminCard
                  title={activeTab === "reports" ? "已删除举报" : "已删除线索与建议"}
                  description="所有永久删除都只能在回收站执行；恢复后会回到已处理/已查看状态。"
                >
                  <MessageRecycleBinList data={messageRecycleData ?? { state: "ready", type: activeTab, items: [] }} />
                </AdminCard>
              </>
            ) : null}
            {activeTab === "image-cleanup" && imageCleanupData ? (
              <>
                {canViewImages ? <AdminImageCleanupPermissionBadges permissions={imageCleanupData.permissions} /> : null}
                {!canViewImages ? (
                  <AdminPageHeader title="图片清理工具" description={`当前管理员没有 ${getAdminPermissionLabel("view_images")} 或 ${getAdminPermissionLabel("manage_image_assets")} 权限。`}>
                    <AdminImageCleanupPermissionBadges permissions={imageCleanupData.permissions} />
                  </AdminPageHeader>
                ) : (
                  <>
                    {imageCleanupData.state === "error" || imageCleanupData.state === "missing_config" ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                        图片清理工具暂时不可用：{imageCleanupData.error ?? "请稍后再试。"}
                      </div>
                    ) : null}

                    <AdminImageCleanupHealthSection totals={imageCleanupData.totals} activeFilter={imageFilter} />

                    <AdminCard title="扫描图片资产" description="默认显示未绑定业务内容、也未被帖子图片引用的疑似未使用图片；使用中的图片只读展示。">
                      <AdminImageCleanupFilter filter={params?.filter} source={params?.source} q={params?.q} />
                    </AdminCard>

                    <AdminCard title="图片资产列表" description="使用中的图片不会出现删除按钮。外部图片只标记资产记录，不删除远端原图。">
                      <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                        默认按最近创建排序，每页显示 {imageCleanupData.pageSize} 条。
                      </div>
                      <AdminImageAssetsList assets={imageCleanupData.assets} canDelete={canDeleteImages} />
                      <AdminImageCleanupPagination
                        page={imageCleanupData.page}
                        pageCount={imageCleanupData.pageCount}
                        totalCount={imageCleanupData.totalCount}
                        filter={params?.filter}
                        source={params?.source}
                        q={params?.q}
                      />
                    </AdminCard>
                  </>
                )}
              </>
            ) : null}
            {activeTab === "notifications" ? (
              <AdminCard title="已删除通知" description="只清理用户已经删除的通知，不影响仍在用户消息中心显示的通知。">
                <AdminNotificationRecycleBin data={notificationRecycleData ?? { state: "ready", superAdmin: false, deletedCount: 0, olderThan30Count: 0, olderThan90Count: 0, recentItems: [] }} />
              </AdminCard>
            ) : null}
          </div>
        );
      }}
    </AdminAuthGate>
  );
}

function normalizeResourceTab(value?: string): RecycleBinResourceType {
  if (value === "news" || value === "navigation" || value === "ads" || value === "reports" || value === "feedback" || value === "notifications" || value === "image-cleanup") return value;
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

function normalizePage(value?: string) {
  if (!value) return 1;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1;
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
