import type { HomeBannerItem } from "@/components/home/HomeBanner";
import type { QuickGridItem } from "@/components/home/QuickGrid";
import type { UtilityCardItem, UtilityIconKey, UtilityTheme } from "@/components/home/UtilityCards";
import type { TopQuickLink } from "@/features/navigation/topQuickLinks";
import { fallbackLatestPostSections, fallbackQuickGridItems, fallbackSeoContent, fallbackTickerItems, fallbackUtilityTools } from "./fallbacks";
import type { HomeLatestPostSectionConfig, HomeSectionRecord, HomeSeoContent, HomeTickerItem } from "./types";

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function firstRecord(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) {
    return asRecord(value[0]);
  }

  return asRecord(value);
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asNumber(value: unknown, fallback: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? Math.trunc(numeric) : fallback;
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function isOpenMode(value: unknown): value is TopQuickLink["open_mode"] {
  return value === "same" || value === "new";
}

export function mapTopQuickLink(row: Record<string, unknown>): TopQuickLink | null {
  const id = asString(row.id);
  const title = asString(row.title);
  const url = normalizeRoute(asString(row.url, asString(row.href)));

  if (!id || !title || !url) {
    return null;
  }

  return {
    id,
    title,
    url,
    open_mode: isOpenMode(row.open_mode) ? row.open_mode : "same",
    sort_order: asNumber(row.sort_order, 0),
    is_active: asBoolean(row.is_active, true),
    city_id: typeof row.city_id === "string" ? row.city_id : null,
    icon: asString(row.icon) || undefined,
  };
}

export function mapTickerItem(row: Record<string, unknown>): HomeTickerItem | null {
  const rawLabel = asString(row.title);
  const href = normalizeRoute(asString(row.href, "/news"));
  const label = isPlaceholderTickerLabel(rawLabel) ? fallbackTickerLabelForRoute(href) : rawLabel;

  if (!label) {
    return null;
  }

  return {
    label,
    href,
    module: asString(row.module) || null,
  };
}

function isPlaceholderTickerLabel(value: string) {
  const normalized = value.trim();
  return normalized === "??" || normalized === "????" || /^\?+$/.test(normalized);
}

function fallbackTickerLabelForRoute(href: string) {
  if (href.startsWith("/jobs")) return "发布信息请填写真实联系方式，平台会持续优化内容审核";
  if (href.startsWith("/housing")) return "收藏常用内容，登录后可继续管理你的发布信息";
  if (href.startsWith("/secondhand")) return "如发现虚假或过期信息，可在详情页举报";
  if (href.startsWith("/services")) return "DMV 笔试练习、纽约生活导航、新闻资讯正在陆续完善";
  return fallbackTickerItems[0]?.label;
}

export function mapBanner(row: Record<string, unknown>): HomeBannerItem | null {
  const title = asString(row.title);
  const imageAsset = firstRecord(row.image_assets);
  const metadata = asRecord(row.metadata);
  const imageUrl = asString(imageAsset.public_url, asString(imageAsset.external_url, asString(metadata.image_url)));

  if (!title || !imageUrl) {
    return null;
  }

  return {
    title,
    description: asString(row.subtitle, asString(row.description, asString(metadata.description))),
    href: normalizeRoute(asString(row.href, "/")),
    imageUrl,
    openMode: asString(row.open_mode) || null,
    slug: asString(row.slug) || null,
  };
}

export function mapHomeSections(rows: Array<Record<string, unknown>>): Record<string, HomeSectionRecord> {
  const entries = rows
    .map((row): [string, HomeSectionRecord] | null => {
      const key = asString(row.section_key, asString(row.key));
      if (!key) return null;

      return [
        key,
        {
          key,
          title: asString(row.title, key),
          description: asString(row.description) || null,
          module: asString(row.module, asString(row.section_type, "home")),
          config: asRecord(row.config),
          is_visible: asBoolean(row.is_visible, true),
          sort_order: asNumber(row.sort_order, 0),
        },
      ];
    })
    .filter((entry): entry is [string, HomeSectionRecord] => entry !== null);

  return Object.fromEntries(entries);
}

export function mapUtilityTools(section?: HomeSectionRecord): UtilityCardItem[] {
  if (!section?.config) {
    return fallbackUtilityTools;
  }

  const items = Array.isArray(section.config.items) ? section.config.items : [];
  if (items.length === 0) {
    return [];
  }

  const mapped = items
    .map((item, index): (UtilityCardItem & { sortOrder: number }) | null => {
      const record = asRecord(item);
      const icon = normalizeUtilityIcon(record.icon);
      const title = asString(record.title);
      const href = normalizeRoute(asString(record.href));

      if (!title || !href || !icon) {
        return null;
      }

      return {
        title,
        description: asString(record.description),
        href,
        icon,
        theme: normalizeUtilityTheme(record.theme),
        cta: asString(record.cta) || undefined,
        isVisible: asBoolean(record.is_visible, asBoolean(record.isVisible, true)),
        sortOrder: asNumber(record.sort_order, index),
      };
    })
    .filter((item): item is UtilityCardItem & { sortOrder: number } => item !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      title: item.title,
      description: item.description,
      href: item.href,
      icon: item.icon,
      theme: item.theme,
      cta: item.cta,
      isVisible: item.isVisible,
    }));

  return mapped;
}

export function mapLatestPostSections(section?: HomeSectionRecord): HomeLatestPostSectionConfig[] {
  if (!section?.config) {
    return fallbackLatestPostSections;
  }

  if (!Array.isArray(section.config.sections)) {
    return fallbackLatestPostSections;
  }

  const sections = section.config.sections;
  if (sections.length === 0) {
    return [];
  }

  const mapped = sections
    .map((item, index): HomeLatestPostSectionConfig | null => {
      const record = asRecord(item);
      const postType = normalizePostType(record.post_type ?? record.postType);
      const fallback = postType ? fallbackLatestPostSections.find((value) => value.postType === postType) : undefined;

      if (!postType || !fallback) {
        return null;
      }

      return {
        key: asString(record.key, fallback.key),
        title: asString(record.title, fallback.title),
        navLabel: asString(record.navLabel, asString(record.nav_label, fallback.navLabel)),
        postType,
        route: normalizeRoute(asString(record.route, fallback.route)),
        isVisible: asBoolean(record.is_visible, asBoolean(record.isVisible, true)),
        sortOrder: asNumber(record.sort_order, index),
        limitCount: clamp(asNumber(record.limit_count, fallback.limitCount), 1, 30),
        layout: normalizeLayout(record.layout, fallback.layout),
        description: asString(record.description, fallback.description),
        emptyMessage: asString(record.emptyMessage, asString(record.empty_message, fallback.emptyMessage)),
      };
    })
    .filter((item): item is HomeLatestPostSectionConfig => item !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return mapped;
}

export function mapQuickGridItems(section?: HomeSectionRecord): QuickGridItem[] {
  if (!section?.config) {
    return fallbackQuickGridItems;
  }

  const items = Array.isArray(section.config.items) ? section.config.items : [];
  if (items.length === 0) {
    return [];
  }

  const mapped = items
    .map((item, index): (QuickGridItem & { sortOrder: number; isVisible: boolean }) | null => {
      const record = asRecord(item);
      const href = normalizeRoute(asString(record.href));
      const fallback = fallbackQuickGridItems.find((value) => value.href === href || value.label === record.label);
      const label = asString(record.label, asString(record.title, fallback?.label));
      const icon = fallback?.icon;

      if (!label || !href || !icon) {
        return null;
      }

      return {
        label,
        href,
        icon,
        isVisible: asBoolean(record.is_visible, asBoolean(record.isVisible, true)),
        sortOrder: asNumber(record.sort_order, index),
      };
    })
    .filter((item): item is QuickGridItem & { sortOrder: number; isVisible: boolean } => item !== null && item.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      label: item.label,
      href: item.href,
      icon: item.icon,
    }));

  return mapped;
}

export function mapSeoContent(section?: HomeSectionRecord): HomeSeoContent {
  if (!section?.config) {
    return fallbackSeoContent;
  }

  return {
    title: asString(section.config.title, section.title || fallbackSeoContent.title),
    content: asString(section.config.content, fallbackSeoContent.content),
    isVisible: section.is_visible,
  };
}

function normalizeUtilityIcon(value: unknown): UtilityIconKey | null {
  if (value === "dmv" || value === "car") return "dmv";
  if (value === "ticket" || value === "alert") return "ticket";
  if (value === "navigation" || value === "map") return "navigation";
  if (value === "guide" || value === "book") return "guide";
  return null;
}

function normalizeUtilityTheme(value: unknown): UtilityTheme {
  return value === "orange" || value === "cyan" || value === "amber" ? value : "blue";
}

function normalizePostType(value: unknown): HomeLatestPostSectionConfig["postType"] | null {
  if (value === "job" || value === "jobs") return "job";
  if (value === "housing") return "housing";
  if (value === "marketplace" || value === "secondhand") return "marketplace";
  if (value === "service" || value === "services") return "service";
  if (value === "news") return "news";
  return null;
}

function normalizeLayout(value: unknown, fallback: HomeLatestPostSectionConfig["layout"]) {
  return value === "grid" || value === "media" || value === "news" ? value : fallback;
}

function normalizeRoute(route: string) {
  return route.startsWith("/") && route.slice(1) === "marketplace" ? "/secondhand" : route;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
