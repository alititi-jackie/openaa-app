import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Power, Trash2 } from "lucide-react";
import { AdminActionForm, AdminCheckbox, AdminSelect, AdminTextarea, AdminTextInput } from "@/components/admin/AdminActionForm";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { createDefaultHomeConfig, removeHomeBannerImage, updateHomeSection, updateLatestPostsSection, updateLatestTickerGlobalSettings, updateLatestTickerSettings, upsertHomeBanner, upsertLatestTicker } from "@/features/admin-home/actions";
import { getAdminHomeConfigData } from "@/features/admin-home/queries";
import type { AdminHomeBannerRow, AdminHomeSectionRow, AdminTickerGlobalSettingsRow, AdminTickerRow, AdminTickerSectionSettingsRow } from "@/features/admin-home/types";
import { fallbackLatestPostSections } from "@/features/home/fallbacks";
import { mapLatestPostSections } from "@/features/home/mappers";
import { hasAdminModule } from "@/lib/permissions/admin";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "首页配置管理",
  description: "OpenAA 后台首页配置管理。",
  path: "/admin/home",
  noIndex: true,
});

type AdminHomePageProps = {
  searchParams?: Promise<{ bannerStatus?: string }>;
};

export default function AdminHomePage({ searchParams }: AdminHomePageProps) {
  return (
    <AdminAuthGate>
      {async () => {
        const params = await searchParams;
        if (!(await hasAdminModule("home"))) {
          return (
            <div className="space-y-4">
              <AdminTopActions />
              <AdminPageHeader title="首页配置管理" description="当前管理员没有首页配置管理模块权限。" />
            </div>
          );
        }
        const data = await getAdminHomeConfigData(params?.bannerStatus);
        const canManageAny = data.permissions.manageHomeSections || data.permissions.manageTopLinks || data.permissions.manageLatestTicker || data.permissions.manageAds;

        if (!canManageAny) {
          return <AdminPageHeader title="首页配置管理" description="当前管理员没有首页配置相关权限。" />;
        }
        const showDefaultConfigPrompt = data.permissions.manageHomeSections && data.homeSections.length === 0;

        return (
          <div className="space-y-4">
            <AdminTopActions />
            <AdminPageHeader title="首页配置管理" description="管理首页模块、最新动态、Banner 与顶部快捷导航入口。">
              <AdminPermissionBadge allowed={data.permissions.manageHomeSections} label="manage_home_sections" />
              <AdminPermissionBadge allowed={data.permissions.manageTopLinks} label="manage_top_links" />
              <AdminPermissionBadge allowed={data.permissions.manageLatestTicker} label="manage_latest_ticker" />
              <AdminPermissionBadge allowed={data.permissions.manageAds} label="manage_ads" />
              <Link href="/admin/navigation?tab=top-links" className="inline-flex min-h-8 items-center rounded-full bg-blue-50 px-3 text-xs font-black text-blue-700">
                管理顶部快捷导航
              </Link>
            </AdminPageHeader>

            {showDefaultConfigPrompt ? (
              <section className="rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
                <div className="mb-3">
                  <h2 className="text-lg font-black text-amber-950">初始化首页配置</h2>
                  <p className="mt-1 text-sm leading-6 text-amber-800">当前数据库还没有首页配置。可以创建一套默认配置，之后再按需要编辑各模块。</p>
                </div>
                <AdminActionForm action={createDefaultHomeConfig} submitLabel="创建默认首页配置">
                  <p className="text-sm leading-6 text-amber-800">会写入 home_sections；如果当前账号也有对应权限，会同时写入 top_quick_links 和 latest_ticker。</p>
                </AdminActionForm>
              </section>
            ) : null}

            {data.permissions.manageHomeSections ? (
              <HomeConfigPanel title="首页模块" description="控制首页入口、实用工具、最新发布和 SEO 内容。" summary={getHomeModulesPanelSummary(data.homeSections)}>
                <div className="grid gap-4">
                  {data.homeSections.length > 0 ? (
                    data.homeSections.map((section) =>
                      section.key === "latest_posts" ? <LatestPostsSectionForm key={section.key} section={section} /> : <HomeSectionForm key={section.key} section={section} />,
                    )
                  ) : (
                    <p className="text-sm text-slate-500">暂无 home_sections 配置，可先创建默认配置。</p>
                  )}
                </div>
              </HomeConfigPanel>
            ) : null}

            {data.permissions.manageLatestTicker ? (
              <HomeConfigPanel title="最新动态 / 信息滚动条" description="管理首页单行滚动信息和五类内容来源。" summary={getTickerPanelSummary(data.tickerGlobalSettings, data.tickerSectionSettings, data.tickerItems)}>
                <div className="grid gap-4">
                  <TickerGlobalSettingsForm globalSettings={data.tickerGlobalSettings} />
                  <AutomaticTickerPanel sections={data.tickerSectionSettings} />
                  <ManualTickerPanel items={data.tickerItems} />
                </div>
              </HomeConfigPanel>
            ) : null}

            {data.permissions.manageHomeSections ? (
              <HomeConfigPanel title="首页 Banner" description="管理首页 Banner 图片、链接、启用状态和排期。" summary={getBannerPanelSummary(data.banners)}>
                <div className="grid gap-4">
                  <BannerStatusFilter status={params?.bannerStatus} />
                  {data.banners.map((banner) => (
                    <BannerForm key={banner.id} banner={banner} />
                  ))}
                  <BannerForm />
                </div>
              </HomeConfigPanel>
            ) : null}
          </div>
        );
      }}
    </AdminAuthGate>
  );
}

function HomeConfigPanel({
  title,
  description,
  summary,
  children,
}: {
  title: string;
  description?: string;
  summary: string[];
  children: ReactNode;
}) {
  return (
    <details className="group rounded-2xl border border-slate-100 bg-white shadow-sm [&>summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-4">
        <div className="min-w-0">
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          {description ? <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p> : null}
          <SummaryPills items={summary} className="mt-3" />
        </div>
        <span className="shrink-0 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white group-open:hidden">展开编辑</span>
        <span className="hidden shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 group-open:inline-flex">收起</span>
      </summary>
      <div className="border-t border-slate-100 p-4 pt-4">
        {children}
      </div>
    </details>
  );
}

function NestedConfigPanel({
  title,
  summary,
  children,
  tone = "slate",
}: {
  title: string;
  summary: string[];
  children: ReactNode;
  tone?: "slate" | "blue";
}) {
  const toneClass = tone === "blue" ? "border-blue-100 bg-blue-50" : "border-slate-100 bg-slate-50";

  return (
    <details className={`group rounded-2xl border p-3 [&>summary::-webkit-details-marker]:hidden ${toneClass}`}>
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-900">{title}</p>
          <SummaryPills items={summary} className="mt-2" />
        </div>
        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200 group-open:hidden">编辑</span>
        <span className="hidden shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200 group-open:inline-flex">收起</span>
      </summary>
      <div className="mt-3 border-t border-white/70 pt-3">
        {children}
      </div>
    </details>
  );
}

function SummaryPills({ items, className = "" }: { items: string[]; className?: string }) {
  return items.length > 0 ? (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
          {item}
        </span>
      ))}
    </div>
  ) : null;
}

function getHomeModulesPanelSummary(sections: AdminHomeSectionRow[]) {
  const visibleCount = sections.filter((section) => section.is_visible).length;
  return [`模块 ${sections.length}`, `显示中 ${visibleCount}`, `隐藏 ${sections.length - visibleCount}`];
}

function getTickerPanelSummary(globalSettings: AdminTickerGlobalSettingsRow, sections: AdminTickerSectionSettingsRow[], items: AdminTickerRow[]) {
  return [
    globalSettings.is_enabled ? "滚动条开启" : "滚动条关闭",
    `间隔 ${globalSettings.interval_seconds} 秒`,
    ...sections.map((section) => `${section.section_name} ${section.is_enabled ? section.display_count : "隐藏"}`),
    `手动动态 ${items.length}`,
  ];
}

function getBannerPanelSummary(banners: AdminHomeBannerRow[]) {
  const activeCount = banners.filter((banner) => banner.computed_status === "active").length;
  const inactiveCount = banners.filter((banner) => banner.computed_status === "inactive").length;
  const scheduledCount = banners.filter((banner) => banner.computed_status === "scheduled").length;
  const expiredCount = banners.filter((banner) => banner.computed_status === "expired").length;
  return [`Banner ${banners.length}`, `正在显示 ${activeCount}`, `停用 ${inactiveCount}`, `未开始 ${scheduledCount}`, `已过期 ${expiredCount}`];
}

function getTickerItemSummary(item?: AdminTickerRow) {
  if (!item) return ["新增排在最前", "默认启用"];
  return [item.is_enabled ? "启用" : "停用", item.href || "无链接", `排序 ${item.sort_order}`];
}

function getBannerItemSummary(banner?: AdminHomeBannerRow) {
  if (!banner) return ["新建", "需要图片"];
  const statusLabelMap: Record<AdminHomeBannerRow["computed_status"], string> = {
    active: "正在显示",
    inactive: "已停用",
    scheduled: "未开始",
    expired: "已过期",
  };
  return [
    statusLabelMap[banner.computed_status],
    banner.href || "无链接",
    banner.image_url ? "有图片" : "无图片",
    `排序 ${banner.sort_order}`,
  ];
}

function LatestPostsSectionForm({ section }: { section: AdminHomeSectionRow }) {
  const currentSections = mapLatestPostSections(section);
  const formSections = fallbackLatestPostSections.map((fallback) => currentSections.find((item) => item.key === fallback.key || item.postType === fallback.postType) ?? fallback);
  const summary = getHomeSectionSummary(section);

  return (
    <NestedConfigPanel title={summary.title} summary={[section.key, section.is_visible ? "显示中" : "已隐藏", ...summary.items]} tone="blue">
      <AdminActionForm action={updateLatestPostsSection} submitLabel="保存最新发布模块">
        <div className="grid gap-3 md:grid-cols-2">
          <AdminTextInput label="模块标题" name="section_title" defaultValue={section.title} required />
          <AdminTextInput label="模块说明" name="section_description" defaultValue={section.description} />
          <AdminTextInput label="模块排序" name="section_sort_order" type="number" defaultValue={section.sort_order} />
          <div className="flex items-end">
            <AdminCheckbox label="显示最新发布模块" name="section_is_visible" defaultChecked={section.is_visible} />
          </div>
        </div>

        <div className="grid gap-3">
          {formSections.map((item) => (
            <div key={item.key} className="rounded-xl border border-blue-100 bg-white p-3">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-black text-white">{item.key}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{item.route}</span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">显示 {item.limitCount} 条</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <AdminTextInput label="模块标题" name={`title_${item.key}`} defaultValue={item.title} required />
                <AdminTextInput label="顶部入口文字" name={`nav_label_${item.key}`} defaultValue={item.navLabel ?? item.title} required />
                <AdminTextInput label="排序" name={`sort_order_${item.key}`} type="number" defaultValue={item.sortOrder} />
                <AdminTextInput label="显示数量" name={`limit_count_${item.key}`} type="number" defaultValue={item.limitCount} />
                <AdminTextInput label="说明" name={`description_${item.key}`} defaultValue={item.description} />
                <AdminTextInput label="无数据提示" name={`empty_message_${item.key}`} defaultValue={item.emptyMessage ?? "暂无最新信息"} />
              </div>
              <AdminCheckbox label="显示这个最新发布分区" name={`is_visible_${item.key}`} defaultChecked={item.isVisible !== false} />
            </div>
          ))}
        </div>

        <p className="rounded-xl bg-white px-3 py-2 text-xs font-semibold leading-5 text-slate-500">
          最新发布按旧站方式纵向展示招聘、房屋、二手、本地服务和新闻；二手在新站统一使用 /marketplace。
        </p>
      </AdminActionForm>
    </NestedConfigPanel>
  );
}

function HomeSectionForm({ section }: { section: AdminHomeSectionRow }) {
  const summary = getHomeSectionSummary(section);

  return (
    <NestedConfigPanel title={summary.title} summary={[section.key, section.is_visible ? "显示中" : "已隐藏", ...summary.items]}>
      <AdminActionForm action={updateHomeSection} submitLabel="保存模块">
        <input type="hidden" name="key" value={section.key} />
        <div className="grid gap-3 md:grid-cols-2">
          <AdminTextInput label="模块 Key" name="key_display" defaultValue={section.key} />
          <AdminTextInput label="标题" name="title" defaultValue={section.title} required />
          <AdminTextInput label="排序" name="sort_order" type="number" defaultValue={section.sort_order} />
          <AdminTextInput label="描述" name="description" defaultValue={section.description} />
        </div>
        <AdminCheckbox label="显示模块" name="is_visible" defaultChecked={section.is_visible} />
        <AdminTextarea label="Config JSON" name="config" rows={10} defaultValue={JSON.stringify(section.config ?? {}, null, 2)} />
      </AdminActionForm>
    </NestedConfigPanel>
  );
}

function getHomeSectionSummary(section: AdminHomeSectionRow) {
  const config = section.config ?? {};

  if (section.key === "quick_grid") {
    const items = Array.isArray(config.items) ? config.items : [];
    return {
      title: "首页 8 宫格入口",
      description: "控制首页主要频道入口的显示、顺序和跳转。",
      items: [`入口数量 ${items.length}`],
    };
  }

  if (section.key === "utility_tools") {
    const items = Array.isArray(config.items) ? config.items : [];
    return {
      title: "实用工具模块",
      description: "控制 DMV、导航、指南等工具卡片。",
      items: [`工具数量 ${items.length}`],
    };
  }

  if (section.key === "latest_posts") {
    const sections = Array.isArray(config.sections) ? config.sections : [];
    const visibleCount = sections.filter((item) => typeof item === "object" && item && "is_visible" in item && item.is_visible !== false).length;
    return {
      title: "最新发布模块",
      description: "控制招聘、房屋、市场、服务、新闻等首页聚合模块。",
      items: [`分区 ${sections.length}`, `显示 ${visibleCount}`],
    };
  }

  if (section.key === "seo_content") {
    const title = typeof config.title === "string" ? config.title : "SEO 文案";
    return {
      title,
      description: "控制首页底部 SEO 文案内容。",
      items: [],
    };
  }

  return {
    title: section.title,
    description: "可通过下方 JSON 配置调整模块结构。",
    items: [],
  };
}

function TickerGlobalSettingsForm({ globalSettings }: { globalSettings: AdminTickerGlobalSettingsRow }) {
  return (
    <NestedConfigPanel title="全局设置" summary={[globalSettings.is_enabled ? "滚动条开启" : "滚动条关闭", `间隔 ${globalSettings.interval_seconds} 秒`]} tone="blue">
      <AdminActionForm action={updateLatestTickerGlobalSettings} submitLabel="保存全局设置">
        <div className="grid gap-3 md:grid-cols-2">
          <AdminTextInput label="滚动间隔（秒）" name="interval_seconds" type="number" defaultValue={globalSettings.interval_seconds} />
          <div className="flex items-end">
            <AdminCheckbox label="启用最新动态滚动条" name="global_is_enabled" defaultChecked={globalSettings.is_enabled} />
          </div>
        </div>
      </AdminActionForm>
    </NestedConfigPanel>
  );
}

function AutomaticTickerPanel({ sections }: { sections: AdminTickerSectionSettingsRow[] }) {
  return (
    <NestedConfigPanel title="自动动态" summary={getAutomaticTickerSummary(sections)} tone="blue">
      <AdminActionForm action={updateLatestTickerSettings} submitLabel="保存自动动态设置">
        <div className="grid gap-3">
          {sections.map((section, index) => (
            <div key={section.section_key} className="rounded-xl border border-blue-100 bg-white p-3">
              <input type="hidden" name="section_key" value={section.section_key} />
              <input type="hidden" name={`section_name_${section.section_key}`} value={section.section_name} />
              <input type="hidden" name={`sort_order_${section.section_key}`} value={section.sort_order} />
              <div className="grid gap-3 md:grid-cols-[1fr_120px_auto_auto]">
                <div className="text-sm font-black text-slate-800">{section.section_name}</div>
                <AdminTextInput label="显示数量" name={`display_count_${section.section_key}`} type="number" defaultValue={section.display_count} />
                <div className="flex items-end">
                  <AdminCheckbox label="显示" name={`is_enabled_${section.section_key}`} defaultChecked={section.is_enabled} />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    name="intent"
                    value={`move_up:${section.section_key}`}
                    disabled={index === 0}
                    className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`${section.section_name}上移`}
                  >
                    <ArrowUp size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="submit"
                    name="intent"
                    value={`move_down:${section.section_key}`}
                    disabled={index === sections.length - 1}
                    className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`${section.section_name}下移`}
                  >
                    <ArrowDown size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AdminActionForm>
    </NestedConfigPanel>
  );
}

function ManualTickerPanel({ items }: { items: AdminTickerRow[] }) {
  return (
    <NestedConfigPanel title="手动动态" summary={[`现有 ${items.length}`, "支持新增、启停、删除和排序"]}>
      <div className="grid gap-4">
        <TickerForm />
        {items.length > 0 ? (
          items.map((item, index) => (
            <TickerForm key={item.id} item={item} index={index} total={items.length} />
          ))
        ) : (
          <p className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-500">暂无手动动态。</p>
        )}
      </div>
    </NestedConfigPanel>
  );
}

function getAutomaticTickerSummary(sections: AdminTickerSectionSettingsRow[]) {
  const enabledCount = sections.filter((section) => section.is_enabled).length;
  return [`来源 ${sections.length}`, `显示 ${enabledCount}`, `隐藏 ${sections.length - enabledCount}`];
}

function TickerForm({ item, index = 0, total = 0 }: { item?: AdminTickerRow; index?: number; total?: number }) {
  const isExisting = Boolean(item);

  return (
    <div className={item ? "rounded-2xl border border-slate-100 bg-slate-50 p-3" : "rounded-2xl border border-blue-100 bg-blue-50 p-3"}>
      <div className="mb-3">
        <p className="text-sm font-black text-slate-900">{item ? item.title : "新增手动动态"}</p>
        <SummaryPills items={getTickerItemSummary(item)} className="mt-2" />
      </div>
      <AdminActionForm
        action={upsertLatestTicker}
        submitLabel={item ? "保存动态" : "新增动态"}
        footerStart={
          <div className="flex flex-wrap items-center gap-2">
            {!item ? (
              <button type="reset" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700">
                取消
              </button>
            ) : (
              <>
                <button
                  type="submit"
                  name="intent"
                  value="move_up"
                  disabled={index === 0}
                  className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowUp size={15} aria-hidden="true" />
                  上移
                </button>
                <button
                  type="submit"
                  name="intent"
                  value="move_down"
                  disabled={index === total - 1}
                  className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowDown size={15} aria-hidden="true" />
                  下移
                </button>
                <button
                  type="submit"
                  name="intent"
                  value={item?.is_enabled ? "disable" : "enable"}
                  className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700"
                >
                  <Power size={15} aria-hidden="true" />
                  {item?.is_enabled ? "停用" : "启用"}
                </button>
                <button
                  type="submit"
                  name="intent"
                  value="delete"
                  className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-black text-red-700"
                >
                  <Trash2 size={15} aria-hidden="true" />
                  删除
                </button>
              </>
            )}
          </div>
        }
      >
        <input type="hidden" name="id" value={item?.id ?? ""} />
        <input type="hidden" name="sort_order" value={item?.sort_order ?? ""} />
        <div className="grid gap-3 md:grid-cols-2">
          <AdminTextInput label="标题" name="title" defaultValue={item?.title} required />
          <AdminTextInput label="链接" name="href" defaultValue={item?.href} placeholder="/news 或 https://openaa.com/news" required />
          <AdminTextInput label="开始时间" name="starts_at" type="datetime-local" defaultValue={toDateTimeLocal(item?.starts_at)} />
          <AdminTextInput label="结束时间" name="ends_at" type="datetime-local" defaultValue={toDateTimeLocal(item?.ends_at)} />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <AdminCheckbox label="启用" name="is_enabled" defaultChecked={item?.is_enabled ?? true} />
          {isExisting ? <AdminCheckbox label="确认删除这条动态" name="confirm_delete" /> : null}
        </div>
      </AdminActionForm>
    </div>
  );
}

function BannerStatusFilter({ status }: { status?: string }) {
  return (
    <form action="/admin/home" className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-[220px_auto]">
      <select name="bannerStatus" defaultValue={status ?? "all"} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-blue-500">
        <option value="all">全部 Banner</option>
        <option value="active">正在显示</option>
        <option value="scheduled">未开始</option>
        <option value="expired">已过期</option>
        <option value="inactive">已停用</option>
      </select>
      <button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
        筛选 Banner
      </button>
    </form>
  );
}

function BannerForm({ banner }: { banner?: AdminHomeBannerRow }) {
  return (
    <NestedConfigPanel title={banner ? banner.title : "新增 Banner"} summary={getBannerItemSummary(banner)}>
      {banner ? <BannerStatusBadge banner={banner} /> : null}
      {banner?.image_url ? (
        <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <Image src={banner.image_url} alt={banner.title} width={960} height={240} className="h-32 w-full object-cover" unoptimized />
        </div>
      ) : null}
      <AdminActionForm action={upsertHomeBanner} submitLabel={banner ? "保存 Banner" : "新增 Banner"}>
        <input type="hidden" name="id" value={banner?.id ?? ""} />
        <input type="hidden" name="image_asset_id" value={banner?.image_asset_id ?? ""} />
        <div className="grid gap-3 md:grid-cols-2">
          <AdminTextInput label="标题" name="title" defaultValue={banner?.title} required />
          <AdminTextInput label="副标题" name="subtitle" defaultValue={banner?.subtitle} />
          <AdminTextInput label="链接" name="href" defaultValue={banner?.href} placeholder="/navigation" />
          <AdminTextInput label="图片 URL" name="image_url" defaultValue={banner?.image_source_type === "external" ? banner.image_url : ""} placeholder="https://img.openaa.com/..." />
          <label className="grid gap-1.5 text-sm font-bold text-slate-700">
            <span>上传 Banner 图</span>
            <input name="image_file" type="file" accept="image/jpeg,image/png,image/webp" className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-black file:text-slate-700 focus:border-blue-500" />
            <span className="text-xs font-semibold text-slate-500">支持 JPG / PNG / WebP，最大 5MB。上传图片优先于外部 URL。</span>
          </label>
          <AdminSelect label="打开方式" name="open_mode" defaultValue={banner?.open_mode ?? "same"} options={[{ value: "same", label: "当前窗口" }, { value: "new", label: "新窗口" }]} />
          <AdminTextInput label="排序" name="sort_order" type="number" defaultValue={banner?.sort_order ?? 0} />
          <AdminTextInput label="开始时间" name="starts_at" type="datetime-local" defaultValue={toDateTimeLocal(banner?.starts_at)} />
          <AdminTextInput label="结束时间" name="ends_at" type="datetime-local" defaultValue={toDateTimeLocal(banner?.ends_at)} />
        </div>
        <AdminCheckbox label="启用" name="is_active" defaultChecked={banner?.is_active ?? true} />
      </AdminActionForm>
      {banner?.image_asset_id ? (
        <AdminActionForm action={removeHomeBannerImage} submitLabel="移除图片" className="mt-3 border-t border-slate-200 pt-3">
          <input type="hidden" name="id" value={banner.id} />
          <p className="text-xs font-semibold leading-5 text-amber-700">只解除这条 Banner 的图片引用，图片资产会标记为 deleted。</p>
          <AdminCheckbox label="我确认移除这张 Banner 图" name="confirm_remove_image" />
        </AdminActionForm>
      ) : null}
    </NestedConfigPanel>
  );
}

function BannerStatusBadge({ banner }: { banner: AdminHomeBannerRow }) {
  const labelMap: Record<AdminHomeBannerRow["computed_status"], string> = {
    active: "正在显示",
    inactive: "已停用",
    scheduled: "未开始",
    expired: "已过期",
  };
  const classMap: Record<AdminHomeBannerRow["computed_status"], string> = {
    active: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    inactive: "bg-slate-100 text-slate-600 ring-slate-200",
    scheduled: "bg-blue-50 text-blue-700 ring-blue-100",
    expired: "bg-amber-50 text-amber-700 ring-amber-100",
  };

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-black">
      <span className={`rounded-full px-2.5 py-1 ring-1 ${classMap[banner.computed_status]}`}>{labelMap[banner.computed_status]}</span>
      {banner.image_source_type ? <span className="rounded-full bg-white px-2.5 py-1 text-slate-500 ring-1 ring-slate-200">{banner.image_source_type === "storage" ? "上传图片" : "外链图片"}</span> : null}
    </div>
  );
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 16);
}
