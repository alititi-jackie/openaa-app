import Link from "next/link";
import { ArrowDown, ArrowUp, Power, Trash2 } from "lucide-react";
import { AdminActionForm, AdminCheckbox, AdminTextarea, AdminTextInput } from "@/components/admin/AdminActionForm";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { ConfigControlRow, HomeConfigPanel, NestedConfigPanel, TickerItemConfigPanel } from "@/components/admin/home-config/ConfigPanels";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { ManualTickerCreateForm } from "@/components/admin/ManualTickerCreateForm";
import { createDefaultHomeConfig, updateHomeSection, updateLatestPostsSection, updateLatestTickerGlobalSettings, updateLatestTickerSettings, updateSeoContentSection, upsertLatestTicker } from "@/features/admin-home/actions";
import { getAdminHomeConfigData } from "@/features/admin-home/queries";
import type { AdminHomeSectionRow, AdminTickerGlobalSettingsRow, AdminTickerRow, AdminTickerSectionSettingsRow } from "@/features/admin-home/types";
import { HOME_SECTION_KEYS } from "@/features/home/constants";
import { fallbackLatestPostSections, fallbackQuickGridItems, fallbackSeoContent, fallbackUtilityTools } from "@/features/home/fallbacks";
import { mapLatestNewsCategories, mapLatestPostSections } from "@/features/home/mappers";
import { hasAdminModule } from "@/lib/permissions/admin";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "首页配置管理",
  description: "OpenAA 后台首页配置管理。",
  path: "/admin/home",
  noIndex: true,
});

export default function AdminHomePage() {
  return (
    <AdminAuthGate>
      {async () => {
        if (!(await hasAdminModule("home"))) {
          return (
            <div className="space-y-4">
              <AdminTopActions />
              <AdminPageHeader title="首页配置管理" description="当前管理员没有首页配置管理模块权限。" />
            </div>
          );
        }

        const data = await getAdminHomeConfigData();
        const canManageAny = data.permissions.manageHomeSections || data.permissions.manageTopLinks || data.permissions.manageLatestTicker || data.permissions.manageAds;

        if (!canManageAny) {
          return <AdminPageHeader title="首页配置管理" description="当前管理员没有首页配置相关权限。" />;
        }

        const showDefaultConfigPrompt = data.permissions.manageHomeSections && data.homeSections.length === 0;
        const sectionMap = new Map(data.homeSections.map((section) => [section.key, section]));
        const quickGridSection = sectionMap.get(HOME_SECTION_KEYS.quickGrid);
        const utilityToolsSection = sectionMap.get(HOME_SECTION_KEYS.utilityTools);
        const latestPostsSection = sectionMap.get(HOME_SECTION_KEYS.latestPosts);
        const seoContentSection = sectionMap.get(HOME_SECTION_KEYS.seoContent);

        return (
          <div className="space-y-4">
            <AdminTopActions />
            <AdminPageHeader title="首页配置管理" description="按首页实际展示顺序管理首页内容。首页顶部广告位请到广告管理中配置。">
              <AdminPermissionBadge allowed={data.permissions.manageHomeSections} label="manage_home_sections" />
              <AdminPermissionBadge allowed={data.permissions.manageTopLinks} label="manage_top_links" />
              <AdminPermissionBadge allowed={data.permissions.manageLatestTicker} label="manage_latest_ticker" />
              <AdminPermissionBadge allowed={data.permissions.manageAds} label="manage_ads" />
              <Link href="/admin/navigation?tab=top-links" className="inline-flex min-h-8 items-center rounded-full bg-blue-50 px-3 text-xs font-black text-blue-700">
                管理顶部快捷导航
              </Link>
            </AdminPageHeader>

            {showDefaultConfigPrompt ? <DefaultConfigPrompt /> : null}

            <HomeBannerNotice />

            {data.permissions.manageLatestTicker ? (
              <HomeConfigPanel title="最新动态 / 信息滚动条" description="控制首页顶部信息滚动条的全局开关、自动动态和手动动态。" summary={getTickerPanelSummary(data.tickerGlobalSettings, data.tickerSectionSettings, data.tickerItems)}>
                <div className="grid gap-4">
                  <TickerGlobalSettingsForm globalSettings={data.tickerGlobalSettings} />
                  <AutomaticTickerPanel sections={data.tickerSectionSettings} />
                  <ManualTickerPanel items={data.tickerItems} />
                </div>
              </HomeConfigPanel>
            ) : null}

            {data.permissions.manageHomeSections ? (
              <>
                <OrderedHomeSectionCard section={quickGridSection} kind="quick_grid" title="首页 8 宫格入口" description="控制首页主要频道入口的显示状态和顺序。" />
                <OrderedHomeSectionCard section={utilityToolsSection} kind="utility_tools" title="实用工具模块" description="控制 DMV、导航、指南等工具卡片的显示状态和顺序。" />
                <LatestPostsSectionCard section={latestPostsSection} />
                <OpenAASeoCard section={seoContentSection} />
              </>
            ) : null}
          </div>
        );
      }}
    </AdminAuthGate>
  );
}

function DefaultConfigPrompt() {
  return (
    <section className="rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
      <div className="mb-3">
        <h2 className="text-lg font-black text-amber-950">初始化首页配置</h2>
        <p className="mt-1 text-sm leading-6 text-amber-800">当前数据库还没有首页配置。可以创建一套默认配置，之后再按需要编辑各模块。</p>
      </div>
      <AdminActionForm action={createDefaultHomeConfig} submitLabel="创建默认首页配置">
        <p className="text-sm leading-6 text-amber-800">仅在首页配置为空时显示。会写入首页基础配置；如当前账号也有对应权限，会同时补齐顶部快捷入口和最新动态默认项。</p>
      </AdminActionForm>
    </section>
  );
}

function HomeBannerNotice() {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">首页 Banner</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">首页顶部广告位请到「广告管理」中配置。</p>
    </section>
  );
}

function MissingSectionNotice({ title }: { title: string }) {
  return (
    <HomeConfigPanel title={title} description="当前数据库缺少这一项首页配置。" summary={["缺少配置"]}>
      <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold leading-6 text-amber-800">请先创建默认首页配置，或检查 home_sections 中是否存在对应记录。</p>
    </HomeConfigPanel>
  );
}

type OrderedHomeSectionKind = "quick_grid" | "utility_tools";

function OrderedHomeSectionCard({
  section,
  kind,
  title,
  description,
}: {
  section?: AdminHomeSectionRow;
  kind: OrderedHomeSectionKind;
  title: string;
  description: string;
}) {
  if (!section) return <MissingSectionNotice title={title} />;
  const items = getOrderedHomeSectionItems(section, kind);
  const visibilitySummary = getOrderedHomeSectionVisibilitySummary(items);

  return (
    <HomeConfigPanel title={title} description={description} summary={[section.is_visible ? "显示中" : "已隐藏", ...visibilitySummary]}>
      <OrderedHomeSectionForm section={section} items={items} />
    </HomeConfigPanel>
  );
}

function LatestPostsSectionCard({ section }: { section?: AdminHomeSectionRow }) {
  if (!section) return <MissingSectionNotice title="最新发布模块" />;
  const summary = getHomeSectionSummary(section);

  return (
    <HomeConfigPanel title="最新发布模块" description="控制首页招聘、房屋、二手、本地服务和新闻的最新内容区。" summary={[section.is_visible ? "显示中" : "已隐藏", ...summary.items]}>
      <LatestPostsSectionForm section={section} />
    </HomeConfigPanel>
  );
}

function OrderedHomeSectionForm({
  section,
  items,
}: {
  section: AdminHomeSectionRow;
  items: Array<{ label: string; isVisible: boolean; raw: Record<string, unknown> }>;
}) {
  const config = { ...(section.config ?? {}), items: items.map((item, index) => ({ ...item.raw, sort_order: (index + 1) * 10 })) };

  return (
    <AdminActionForm action={updateHomeSection} submitLabel="">
      <input type="hidden" name="key" value={section.key} />
      <input type="hidden" name="title" value={section.title} />
      <input type="hidden" name="description" value={section.description ?? ""} />
      <input type="hidden" name="sort_order" value={section.sort_order} />
      <input type="hidden" name="config" value={JSON.stringify(config)} />

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
        {section.is_visible ? <input type="hidden" name="is_visible" value="on" /> : null}
        <button
          type="submit"
          name="intent"
          value="toggle_section_visibility"
          className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700"
        >
          {section.is_visible ? "隐藏整个模块" : "打开显示整个模块"}
        </button>
      </div>

      <div className="grid gap-3">
        {items.map((item, index) => (
          <ConfigControlRow
            key={`${item.label}-${index}`}
            title={item.label}
            isVisible={item.isVisible}
            index={index}
            total={items.length}
            moveUpIntent={`move_up:${index}`}
            moveDownIntent={`move_down:${index}`}
            toggleIntent={`toggle_visibility:${index}`}
          >
            <input type="hidden" name={`item_visible_${index}`} value={item.isVisible ? "on" : "off"} />
          </ConfigControlRow>
        ))}
      </div>
    </AdminActionForm>
  );
}

function OpenAASeoCard({ section }: { section?: AdminHomeSectionRow }) {
  if (!section) return <MissingSectionNotice title="OpenAA SEO" />;
  const seo = getSeoContentFormValues(section);

  return (
    <HomeConfigPanel title="OpenAA SEO" description="编辑首页底部 SEO 文案内容。" summary={["只编辑内容", section.is_visible ? "前台显示" : "前台隐藏"]}>
      <AdminActionForm action={updateSeoContentSection} submitLabel="保存 SEO 内容">
        <div className="grid gap-3">
          <AdminTextInput label="SEO 标题" name="seo_title" defaultValue={seo.title} required />
          <AdminTextarea label="SEO 正文" name="seo_content" rows={8} defaultValue={seo.content} />
        </div>
      </AdminActionForm>
    </HomeConfigPanel>
  );
}

function getTickerPanelSummary(globalSettings: AdminTickerGlobalSettingsRow, sections: AdminTickerSectionSettingsRow[], items: AdminTickerRow[]) {
  return [
    globalSettings.is_enabled ? "滚动条开启" : "滚动条关闭",
    `间隔 ${globalSettings.interval_seconds} 秒`,
    ...sections.map((section) => `${section.section_name} ${section.is_enabled ? section.display_count : "隐藏"}`),
    `手动动态 ${items.length}`,
  ];
}

function LatestPostsSectionForm({ section }: { section: AdminHomeSectionRow }) {
  const currentSections = mapLatestPostSections(section);
  const currentKeys = new Set(currentSections.map((item) => item.key));
  const formSections = [
    ...currentSections,
    ...fallbackLatestPostSections.filter((fallback) => !currentKeys.has(fallback.key)),
  ];
  const newsCategories = mapLatestNewsCategories(section);
  const latestNewsCount = newsCategories.filter((item) => item.isVisible !== false).reduce((total, item) => total + item.limitCount, 0);

  return (
    <AdminActionForm action={updateLatestPostsSection} submitLabel="">
      <input type="hidden" name="section_title" value={section.title} />
      <input type="hidden" name="section_description" value={section.description ?? ""} />
      <input type="hidden" name="section_sort_order" value={section.sort_order} />
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
        {section.is_visible ? <input type="hidden" name="section_is_visible" value="on" /> : null}
        <button
          type="submit"
          name="intent"
          value="toggle_section_visibility"
          className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700"
        >
          {section.is_visible ? "隐藏整个模块" : "打开显示整个模块"}
        </button>
      </div>

      <div className="grid gap-3">
        {formSections.map((item, index) => (
          <ConfigControlRow
            key={item.key}
            title={item.title}
            isVisible={item.isVisible !== false}
            index={index}
            total={formSections.length}
            moveUpIntent={`move_up:${item.key}`}
            moveDownIntent={`move_down:${item.key}`}
            decrementIntent={item.key === "news" ? undefined : `decrement:${item.key}`}
            incrementIntent={item.key === "news" ? undefined : `increment:${item.key}`}
            toggleIntent={`toggle:${item.key}`}
            count={item.key === "news" ? undefined : item.limitCount}
            countLabel={item.key === "news" ? `数量由新闻分类决定（当前 ${latestNewsCount} 条）` : undefined}
          >
            <input type="hidden" name={`sort_order_${item.key}`} value={item.sortOrder} />
            <input type="hidden" name={`title_${item.key}`} value={item.title} />
            <input type="hidden" name={`nav_label_${item.key}`} value={item.navLabel ?? item.title} />
            <input type="hidden" name={`limit_count_${item.key}`} value={item.key === "news" ? latestNewsCount : item.limitCount} />
            <input type="hidden" name={`description_${item.key}`} value={item.description} />
            <input type="hidden" name={`empty_message_${item.key}`} value={item.emptyMessage ?? "暂无最新信息"} />
            <input type="hidden" name={`is_visible_${item.key}`} value={item.isVisible !== false ? "on" : "off"} />
          </ConfigControlRow>
        ))}
      </div>

      <NestedConfigPanel title="新闻分类设置" summary={[`分类 ${newsCategories.length}`, `显示 ${newsCategories.filter((item) => item.isVisible !== false).length}`]}>
        <p className="rounded-xl bg-white px-3 py-2 text-xs font-semibold leading-5 text-slate-500">
          新闻主板块不单独设置数量，首页最新新闻数量由下方已显示分类的数量相加决定。
        </p>
        <div className="mt-3 grid gap-3">
          {newsCategories.map((category, index) => (
            <ConfigControlRow
              key={category.key}
              title={category.title}
              isVisible={category.isVisible !== false}
              index={index}
              total={newsCategories.length}
              moveUpIntent={`news_move_up:${category.key}`}
              moveDownIntent={`news_move_down:${category.key}`}
              decrementIntent={`news_decrement:${category.key}`}
              incrementIntent={`news_increment:${category.key}`}
              toggleIntent={`news_toggle:${category.key}`}
              count={category.limitCount}
            >
              <input type="hidden" name={`news_category_slug_${category.key}`} value={category.categorySlug} />
              <input type="hidden" name={`news_title_${category.key}`} value={category.title} />
              <input type="hidden" name={`news_sort_order_${category.key}`} value={category.sortOrder} />
              <input type="hidden" name={`news_limit_count_${category.key}`} value={category.limitCount} />
              <input type="hidden" name={`news_is_visible_${category.key}`} value={category.isVisible !== false ? "on" : "off"} />
            </ConfigControlRow>
          ))}
        </div>
      </NestedConfigPanel>
    </AdminActionForm>
  );
}

function getOrderedHomeSectionItems(section: AdminHomeSectionRow, kind: OrderedHomeSectionKind) {
  const configItems = Array.isArray(section.config?.items) ? section.config.items : [];
  const fallbackItems = kind === "quick_grid" ? fallbackQuickGridItems : fallbackUtilityTools;
  const sourceItems = configItems.length > 0 ? configItems : fallbackItems;

  return sourceItems
    .map((item, index) => {
      const raw = item && typeof item === "object" && !Array.isArray(item) ? { ...(item as Record<string, unknown>) } : {};
      const label =
        typeof raw.label === "string" && raw.label.trim()
          ? raw.label.trim()
          : typeof raw.title === "string" && raw.title.trim()
            ? raw.title.trim()
            : `项目 ${index + 1}`;
      const sortOrder = Number(raw.sort_order ?? raw.sortOrder ?? index + 1);
      const isVisible = typeof raw.is_visible === "boolean" ? raw.is_visible : typeof raw.isVisible === "boolean" ? raw.isVisible : true;

      return {
        label,
        isVisible,
        raw: {
          ...raw,
          sort_order: Number.isFinite(sortOrder) ? sortOrder : index + 1,
          is_visible: isVisible,
        },
      };
    })
    .sort((a, b) => Number(a.raw.sort_order) - Number(b.raw.sort_order));
}

function getOrderedHomeSectionVisibilitySummary(items: Array<{ isVisible: boolean }>) {
  const visibleCount = items.filter((item) => item.isVisible).length;
  return [`项目 ${items.length}`, `显示 ${visibleCount}`, `隐藏 ${items.length - visibleCount}`];
}

function getHomeSectionSummary(section: AdminHomeSectionRow) {
  const config = section.config ?? {};

  if (section.key === HOME_SECTION_KEYS.quickGrid) {
    const items = Array.isArray(config.items) ? config.items : [];
    return {
      title: "首页 8 宫格入口",
      items: [`入口数量 ${items.length}`],
    };
  }

  if (section.key === HOME_SECTION_KEYS.utilityTools) {
    const items = Array.isArray(config.items) ? config.items : [];
    return {
      title: "实用工具模块",
      items: [`工具数量 ${items.length}`],
    };
  }

  if (section.key === HOME_SECTION_KEYS.latestPosts) {
    const sections = Array.isArray(config.sections) ? config.sections : [];
    const visibleCount = sections.filter((item) => typeof item === "object" && item && "is_visible" in item && item.is_visible !== false).length;
    return {
      title: "最新发布模块",
      items: [`分区 ${sections.length}`, `显示 ${visibleCount}`],
    };
  }

  return {
    title: section.title,
    items: [],
  };
}

function getSeoContentFormValues(section: AdminHomeSectionRow) {
  const config = section.config ?? {};
  return {
    title: typeof config.title === "string" && config.title.trim() ? config.title : fallbackSeoContent.title,
    content: typeof config.content === "string" && config.content.trim() ? config.content : fallbackSeoContent.content,
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
      <AdminActionForm action={updateLatestTickerSettings} submitLabel="">
        <div className="grid gap-3">
          {sections.map((section, index) => (
            <ConfigControlRow
              key={section.section_key}
              title={section.section_name}
              isVisible={section.is_enabled}
              index={index}
              total={sections.length}
              moveUpIntent={`move_up:${section.section_key}`}
              moveDownIntent={`move_down:${section.section_key}`}
              decrementIntent={`decrement:${section.section_key}`}
              incrementIntent={`increment:${section.section_key}`}
              toggleIntent={`toggle:${section.section_key}`}
              count={section.display_count}
            >
              <input type="hidden" name="section_key" value={section.section_key} />
              <input type="hidden" name={`section_name_${section.section_key}`} value={section.section_name} />
              <input type="hidden" name={`sort_order_${section.section_key}`} value={section.sort_order} />
              <input type="hidden" name={`display_count_${section.section_key}`} value={section.display_count} />
              <input type="hidden" name={`is_enabled_${section.section_key}`} value={section.is_enabled ? "on" : "off"} />
            </ConfigControlRow>
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
        <ManualTickerCreateForm action={upsertLatestTicker} />
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

function getTickerItemSummary(item: AdminTickerRow) {
  return [item.is_enabled ? "启用" : "停用", item.href ? "有链接" : "无链接"];
}

function TickerForm({ item, index, total }: { item: AdminTickerRow; index: number; total: number }) {
  return (
    <TickerItemConfigPanel title={item.title} summary={getTickerItemSummary(item)}>
      <AdminActionForm
        action={upsertLatestTicker}
        submitLabel="保存动态"
        footerStart={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              name="intent"
              value="move_up"
              disabled={index === 0}
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={`${item.title}上移`}
            >
              <ArrowUp size={15} aria-hidden="true" />
            </button>
            <button
              type="submit"
              name="intent"
              value="move_down"
              disabled={index === total - 1}
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={`${item.title}下移`}
            >
              <ArrowDown size={15} aria-hidden="true" />
            </button>
            <button
              type="submit"
              name="intent"
              value={item.is_enabled ? "disable" : "enable"}
              className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700"
            >
              <Power size={15} aria-hidden="true" />
              {item.is_enabled ? "停用" : "启用"}
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
          </div>
        }
      >
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="sort_order" value={item.sort_order} />
        <div className="grid gap-3 md:grid-cols-2">
          <AdminTextInput label="标题" name="title" defaultValue={item.title} required />
          <AdminTextInput label="链接（可选）" name="href" defaultValue={item.href} placeholder="/news 或 https://openaa.com/news" />
          <AdminTextInput label="开始时间" name="starts_at" type="datetime-local" defaultValue={toDateTimeLocal(item.starts_at)} />
          <AdminTextInput label="结束时间" name="ends_at" type="datetime-local" defaultValue={toDateTimeLocal(item.ends_at)} />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <AdminCheckbox label="启用" name="is_enabled" defaultChecked={item.is_enabled} />
          <AdminCheckbox label="确认删除这条动态" name="confirm_delete" />
        </div>
      </AdminActionForm>
    </TickerItemConfigPanel>
  );
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 16);
}
