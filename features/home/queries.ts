import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { LatestPostGroup } from "@/components/home/LatestPostsSection";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { getAdPlaceholderSetting } from "@/features/ads/placeholders";
import { fallbackLatestNewsCategories, fallbackLatestPostSections, fallbackHomeBanners, fallbackHomeCity, fallbackQuickGridItems, fallbackSeoContent, fallbackTickerItems, fallbackTickerSettings, fallbackTopQuickLinks, fallbackUtilityTools } from "./fallbacks";
import { getHomeTickerSectionDefaults, homeTickerSections, normalizeHomeTickerSectionKey } from "./tickerSections";
import type { PostListItem } from "@/components/posts/PostList";
import { getPublicPosts } from "@/features/posts/queries";
import type { PostType } from "@/features/posts/types";
import { getPublishedNewsList } from "@/features/news/queries";
import type { NewsPostCard } from "@/features/news/types";
import { formatNewsDate } from "@/features/news/mappers";
import { HOME_AD_PLACEMENT, HOME_SECTION_KEYS } from "./constants";
import {
  mapBanner,
  mapHomeSections,
  mapLatestPostSections,
  mapQuickGridItems,
  mapSeoContent,
  mapTickerItem,
  mapTopQuickLink,
  mapUtilityTools,
} from "./mappers";
import type { HomeCity, HomeConfig, HomeLatestPostSectionConfig, HomeSectionRecord, HomeTickerSectionSettings } from "./types";

type HomeSupabaseClient = SupabaseClient;

const HOME_PUBLIC_FETCH_TIMEOUT_MS = 8000;

export async function getHomeConfig(): Promise<HomeConfig> {
  const supabase = createSupabasePublicClient({ revalidate: 300, timeoutMs: HOME_PUBLIC_FETCH_TIMEOUT_MS });

  if (!supabase) {
    return fallbackHomeConfig();
  }

  const city = await getDefaultCity(supabase);
  const sections = await getHomeSections(supabase);
  const hasConfiguredHomeSections = Object.keys(sections).length > 0;
  const latestSectionConfig = getSection(sections, HOME_SECTION_KEYS.latestPosts);
  const utilitySectionConfig = getSection(sections, HOME_SECTION_KEYS.utilityTools);
  const quickGridSectionConfig = getSection(sections, HOME_SECTION_KEYS.quickGrid);
  const seoSectionConfig = getSection(sections, HOME_SECTION_KEYS.seoContent);

  const latestPostSections =
    latestSectionConfig?.is_visible === false || (!latestSectionConfig && hasConfiguredHomeSections) ? [] : mapLatestPostSections(latestSectionConfig).filter((section) => section.isVisible);
  const quickGridItems = quickGridSectionConfig?.is_visible === false || (!quickGridSectionConfig && hasConfiguredHomeSections) ? [] : mapQuickGridItems(quickGridSectionConfig);
  const utilityTools =
    utilitySectionConfig?.is_visible === false || (!utilitySectionConfig && hasConfiguredHomeSections) ? [] : mapUtilityTools(utilitySectionConfig).filter((item) => item.isVisible !== false);
  const tickerSettings = await getLatestTickerSettings(supabase);
  const [topQuickLinks, banners, adPlaceholder, latestPostGroups] = await Promise.all([
    getTopQuickLinks(supabase, city),
    getHomeBanners(supabase),
    getAdPlaceholderSetting(supabase),
    getLatestPostGroups(latestPostSections, supabase),
  ]);
  const tickerPostGroups = await getTickerPostGroups(latestPostSections, tickerSettings, latestPostGroups, supabase);
  const tickerItems = await getLatestTickerItems(supabase, city, tickerSettings, tickerPostGroups);

  return {
    city,
    topQuickLinks,
    banners,
    adPlaceholderImageUrl: adPlaceholder.imageUrl,
    tickerItems,
    tickerSettings,
    quickGridItems,
    utilityTools,
    latestPostGroups,
    latestPostsTitle: latestSectionConfig?.title || "最新发布",
    latestPostsVisible: latestSectionConfig?.is_visible !== false && !(!latestSectionConfig && hasConfiguredHomeSections) && latestPostSections.length > 0,
    utilityToolsVisible: utilitySectionConfig?.is_visible !== false && !(!utilitySectionConfig && hasConfiguredHomeSections) && utilityTools.length > 0,
    quickGridVisible: quickGridSectionConfig?.is_visible !== false && !(!quickGridSectionConfig && hasConfiguredHomeSections) && quickGridItems.length > 0,
    seo: !seoSectionConfig && hasConfiguredHomeSections ? { ...fallbackSeoContent, isVisible: false } : mapSeoContent(seoSectionConfig),
  };
}

export async function getTopQuickLinks(client?: HomeSupabaseClient | null, city = fallbackHomeCity) {
  const supabase = client ?? createSupabasePublicClient();

  if (!supabase) {
    return fallbackTopQuickLinks;
  }

  try {
    let query = supabase
      .from("top_quick_links")
      .select("id,title,href,open_mode,icon,sort_order,is_active,city_id")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (city.id) {
      query = query.or(`city_id.is.null,city_id.eq.${city.id}`);
    }

    const { data, error } = await query;

    if (error) {
      warnHomeConfig("top_quick_links", error.message);
      return fallbackTopQuickLinks;
    }

    const links = (data ?? [])
      .map((row) => mapTopQuickLink({ ...(row as Record<string, unknown>), city_id: city.slug }))
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return links.length > 0 ? links : fallbackTopQuickLinks;
  } catch (error) {
    warnHomeConfig("top_quick_links", error);
    return fallbackTopQuickLinks;
  }
}

export async function getHomeBanners(client?: HomeSupabaseClient | null) {
  const supabase = client ?? createSupabasePublicClient();

  if (!supabase) {
    return fallbackHomeBanners;
  }

  const ads = await readHomeAds(supabase);
  if (ads.length > 0) return ads;
  return fallbackHomeBanners;
}

export async function getLatestTickerItems(
  client?: HomeSupabaseClient | null,
  city = fallbackHomeCity,
  settings = fallbackTickerSettings,
  latestPostGroups?: LatestPostGroup[],
) {
  const supabase = client ?? createSupabasePublicClient();

  if (!settings.global.isEnabled) {
    return [];
  }

  if (supabase) {
    const configuredItems = await getConfiguredTickerItems(supabase, city);
    const dynamicItems = latestPostGroups
      ? mapLatestPostGroupsToTickerItems(latestPostGroups, settings)
      : mapLatestPostGroupsToTickerItems(await getTickerPostGroups(fallbackLatestPostSections.filter((section) => section.isVisible), settings, undefined, supabase), settings);

    const combinedItems = [...configuredItems, ...dynamicItems];
    if (combinedItems.length > 0) {
      return combinedItems;
    }
  }

  const dynamicItems = latestPostGroups
    ? mapLatestPostGroupsToTickerItems(latestPostGroups, settings)
    : mapLatestPostGroupsToTickerItems(await getTickerPostGroups(fallbackLatestPostSections.filter((section) => section.isVisible), settings, undefined, supabase), settings);

  if (dynamicItems.length > 0) {
    return dynamicItems;
  }

  if (!supabase) {
    return fallbackTickerItems;
  }

  return [];
}

async function getConfiguredTickerItems(supabase: HomeSupabaseClient, city = fallbackHomeCity) {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("latest_ticker")
      .select("id,title,href,module,is_enabled,sort_order,starts_at,ends_at")
      .eq("is_enabled", true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order("sort_order", { ascending: true });

    if (error) {
      warnHomeConfig("latest_ticker", error.message);
      return [];
    }

    const meaningfulRows = (data ?? []).filter((row) => !isPlaceholderTickerTitle(row.title));
    const items = meaningfulRows
      .map((row) => mapTickerItem({ ...(row as Record<string, unknown>), city_id: city.slug }))
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return items;
  } catch (error) {
    warnHomeConfig("latest_ticker", error);
    return [];
  }
}

function isPlaceholderTickerTitle(value: unknown) {
  if (typeof value !== "string") return true;
  const normalized = value.trim();
  return normalized === "" || normalized === "??" || normalized === "????" || /^\?+$/.test(normalized);
}

export async function getLatestTickerSettings(client?: HomeSupabaseClient | null) {
  const supabase = client ?? createSupabasePublicClient();

  if (!supabase) {
    return fallbackTickerSettings;
  }

  try {
    const [{ data: global }, { data: sections }] = await Promise.all([
      supabase.from("latest_ticker_global_settings").select("is_enabled,interval_seconds").eq("id", 1).maybeSingle(),
      supabase.from("latest_ticker_sections").select("section_key,section_name,is_enabled,sort_order,display_count").order("sort_order", { ascending: true }),
    ]);

    return {
      global: {
        isEnabled: typeof global?.is_enabled === "boolean" ? global.is_enabled : fallbackTickerSettings.global.isEnabled,
        intervalSeconds: clampTickerNumber(global?.interval_seconds, 3, 10, fallbackTickerSettings.global.intervalSeconds),
      },
      sections: normalizeTickerSectionRows(sections),
    };
  } catch (error) {
    warnHomeConfig("latest_ticker_settings", error);
    return fallbackTickerSettings;
  }
}

export async function getHomeSections(client?: HomeSupabaseClient | null) {
  const supabase = client ?? createSupabasePublicClient();

  if (!supabase) {
    return {};
  }

  try {
    const { data, error } = await supabase
      .from("home_sections")
      .select("key,title,description,module,config,is_visible,sort_order")
      .order("sort_order", { ascending: true });

    if (error) {
      warnHomeConfig("home_sections", error.message);
      return {};
    }

    return mapHomeSections((data ?? []) as Array<Record<string, unknown>>);
  } catch (error) {
    warnHomeConfig("home_sections", error);
    return {};
  }
}

export async function getUtilityTools() {
  const sections = await getHomeSections();
  const hasConfiguredHomeSections = Object.keys(sections).length > 0;
  const section = getSection(sections, HOME_SECTION_KEYS.utilityTools);
  return section?.is_visible === false || (!section && hasConfiguredHomeSections) ? [] : mapUtilityTools(section);
}

export async function getLatestPostSections() {
  const sections = await getHomeSections();
  const hasConfiguredHomeSections = Object.keys(sections).length > 0;
  const section = getSection(sections, HOME_SECTION_KEYS.latestPosts);
  return section?.is_visible === false || (!section && hasConfiguredHomeSections) ? [] : mapLatestPostSections(section).filter((item) => item.isVisible);
}

export async function getHomeSeoContent() {
  const sections = await getHomeSections();
  return mapSeoContent(getSection(sections, HOME_SECTION_KEYS.seoContent));
}

async function getDefaultCity(supabase: HomeSupabaseClient): Promise<HomeCity> {
  try {
    const { data, error } = await supabase.from("cities").select("id,slug,name").eq("is_default", true).maybeSingle();

    if (error || !data) {
      if (error) warnHomeConfig("cities", error.message);
      return fallbackHomeCity;
    }

    const record = data as Record<string, unknown>;

    return {
      id: typeof record.id === "string" ? record.id : null,
      slug: typeof record.slug === "string" ? record.slug : fallbackHomeCity.slug,
      name: typeof record.name === "string" ? record.name : fallbackHomeCity.name,
    };
  } catch (error) {
    warnHomeConfig("cities", error);
    return fallbackHomeCity;
  }
}

async function readHomeAds(supabase: HomeSupabaseClient) {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("ads")
      .select("id,title,href,open_mode,placement,metadata,is_active,sort_order,starts_at,ends_at,link_type,external_url,slug,image_assets(public_url,external_url)")
      .eq("placement", HOME_AD_PLACEMENT)
      .is("deleted_at", null)
      .eq("is_active", true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .order("sort_order", { ascending: true });

    if (error) {
      warnHomeConfig("ads", error.message);
      return [];
    }

    return (data ?? [])
      .map((row) => mapBanner(row as Record<string, unknown>))
      .filter((item): item is NonNullable<typeof item> => item !== null);
  } catch (error) {
    warnHomeConfig("ads", error);
    return [];
  }
}

async function getLatestPostGroups(sections: HomeLatestPostSectionConfig[], client?: HomeSupabaseClient | null) {
  return Promise.all(sections.map((section) => getLatestPostGroup(section, client)));
}

async function getLatestPostGroup(section: HomeLatestPostSectionConfig, client?: HomeSupabaseClient | null): Promise<LatestPostGroup> {
  try {
    if (section.postType === "news") {
      const posts = await getLatestNewsForHomeSection(section, client);
      return { ...section, posts };
    }

    const result = await getPublicPosts({ type: section.postType as PostType, limit: section.limitCount, client: client ?? undefined });
    return { ...section, posts: result.data };
  } catch (error) {
    warnHomeConfig(`latest_posts.${section.key}`, error);
    return { ...section, posts: [] };
  }
}

async function getLatestNewsForHomeSection(section: HomeLatestPostSectionConfig, client?: HomeSupabaseClient | null): Promise<PostListItem[]> {
  const categories = (section.newsCategories ?? fallbackLatestNewsCategories)
    .filter((category) => category.isVisible !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (categories.length === 0) {
    return [];
  }

  const lists = await Promise.all(
    categories.map((category) => getPublishedNewsList({ categorySlug: category.categorySlug, limit: category.limitCount }, client ?? undefined)),
  );
  const seen = new Set<string>();
  const posts: PostListItem[] = [];

  for (const result of lists) {
    for (const post of result.data) {
      if (seen.has(post.id)) continue;
      seen.add(post.id);
      posts.push(mapNewsToHomePost(post));
    }
  }

  return posts;
}

async function getTickerPostGroups(
  sections: HomeLatestPostSectionConfig[],
  settings = fallbackTickerSettings,
  existingGroups?: LatestPostGroup[],
  client?: HomeSupabaseClient | null,
) {
  const tickerSections = expandTickerPostSectionLimits(sections, settings);
  if (tickerSections.length === 0) return [];

  if (existingGroups && canReuseLatestPostGroupsForTicker(tickerSections, existingGroups)) {
    return existingGroups;
  }

  return getLatestPostGroups(tickerSections, client);
}

function expandTickerPostSectionLimits(sections: HomeLatestPostSectionConfig[], settings = fallbackTickerSettings) {
  const enabledTickerSections = settings.sections.filter((section) => section.isEnabled);
  if (enabledTickerSections.length === 0) return [];

  const tickerLimits = new Map<string, number>();
  for (const section of enabledTickerSections) {
    const sectionKey = normalizeTickerModule(section.sectionKey);
    if (sectionKey) tickerLimits.set(sectionKey, section.displayCount);
  }

  return sections
    .map((section) => {
      const sectionKey = normalizeTickerModule(section.key);
      if (!sectionKey || !tickerLimits.has(sectionKey)) return null;
      return {
        ...section,
        limitCount: Math.max(section.limitCount, tickerLimits.get(sectionKey) ?? section.limitCount),
      };
    })
    .filter((section): section is HomeLatestPostSectionConfig => section !== null);
}

function canReuseLatestPostGroupsForTicker(sections: HomeLatestPostSectionConfig[], groups: LatestPostGroup[]) {
  return sections.every((section) => {
    const group = groups.find((item) => normalizeTickerModule(item.key) === normalizeTickerModule(section.key));
    return group && group.posts.length >= section.limitCount;
  });
}

function mapNewsToHomePost(post: NewsPostCard): PostListItem {
  return {
    id: post.id,
    title: post.title,
    description: post.excerpt,
    href: post.href,
    meta: formatNewsDate(post.publishedAt),
    tag: post.categoryName,
    location: formatNewsDate(post.publishedAt),
    publishedAt: post.publishedAt,
    createdAt: post.updatedAt,
    isPinned: post.isPinned,
    pinnedOrder: post.pinnedOrder,
    tickerSortAt: post.publishedAt || post.updatedAt,
    imageUrl: post.coverImageUrl ?? undefined,
    fields: post.isPinned ? [{ label: "pinned", value: "置顶" }] : undefined,
  };
}

function mapLatestPostGroupsToTickerItems(groups: LatestPostGroup[], settings = fallbackTickerSettings) {
  const sectionGroups = new Map<string, LatestPostGroup>();
  for (const group of groups) {
    const sectionKey = normalizeTickerModule(group.key);
    if (!sectionKey || group.isVisible === false || sectionGroups.has(sectionKey)) continue;
    sectionGroups.set(sectionKey, group);
  }

  const candidates = settings.sections
    .filter((section) => section.isEnabled)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((section) => {
      const sectionKey = normalizeTickerModule(section.sectionKey);
      const group = sectionKey ? sectionGroups.get(sectionKey) : null;
      if (!group) return [];

      return group.posts
        .map((post) => mapLatestPostToTickerCandidate(group, post))
        .filter((item): item is TickerCandidate => item !== null)
        .sort(compareTickerCandidates)
        .slice(0, section.displayCount);
    });

  return candidates.map((item) => ({ label: item.label, href: item.href, module: item.module }));
}

type TickerCandidate = {
  label: string;
  href: string;
  module: string;
  isPinned: boolean;
  pinnedOrder: number;
  sortAt: string;
};

function mapLatestPostToTickerCandidate(group: LatestPostGroup, post: PostListItem): TickerCandidate | null {
  const label = buildTickerLabel(group, post);

  if (!label) {
    return null;
  }

  return {
    label,
    href: post.href,
    module: group.key,
    isPinned: post.isPinned === true,
    pinnedOrder: typeof post.pinnedOrder === "number" ? post.pinnedOrder : 0,
    sortAt: post.tickerSortAt || post.publishedAt || post.createdAt || "",
  };
}

function compareTickerCandidates(a: TickerCandidate, b: TickerCandidate) {
  if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
  if (a.isPinned && b.isPinned && a.pinnedOrder !== b.pinnedOrder) return a.pinnedOrder - b.pinnedOrder;
  return dateValue(b.sortAt) - dateValue(a.sortAt);
}

function dateValue(value?: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function buildTickerLabel(group: LatestPostGroup, post: PostListItem) {
  const normalizedSectionKey = normalizeTickerModule(group.key);
  const channel = normalizedSectionKey ? getHomeTickerSectionDefaults(normalizedSectionKey).sectionName : group.navLabel || group.title;
  const detail = tickerPostDetail(post);
  const title = post.title.trim();

  if (!channel || !title) {
    return "";
  }

  return detail ? `[${channel}] ${detail} ${title}` : `[${channel}] ${title}`;
}

function tickerPostDetail(post: PostListItem) {
  return [post.location, post.area, post.tag, post.meta]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .find(Boolean);
}

function getSection(sections: Record<string, HomeSectionRecord>, key: string) {
  return sections[key];
}

function normalizeTickerModule(module?: string | null) {
  return normalizeHomeTickerSectionKey(module);
}

function normalizeTickerSectionRows(rows?: Array<{ section_key: unknown; section_name: unknown; is_enabled: boolean | null; sort_order: unknown; display_count: unknown }> | null) {
  if (!rows || rows.length === 0) return fallbackTickerSettings.sections;

  const sectionMap = new Map<string, HomeTickerSectionSettings>();
  for (const row of rows) {
    const sectionKey = normalizeHomeTickerSectionKey(String(row.section_key));
    if (!sectionKey || sectionMap.has(sectionKey)) continue;

    const defaults = getHomeTickerSectionDefaults(sectionKey);
    sectionMap.set(sectionKey, {
      sectionKey,
      sectionName: defaults.sectionName,
      isEnabled: row.is_enabled !== false,
      sortOrder: clampTickerNumber(row.sort_order, 0, 9999, defaults.sortOrder),
      displayCount: clampTickerNumber(row.display_count, 1, 20, defaults.displayCount),
    });
  }

  return homeTickerSections.map((section) => sectionMap.get(section.sectionKey) ?? {
    sectionKey: section.sectionKey,
    sectionName: section.sectionName,
    isEnabled: true,
    sortOrder: section.sortOrder,
    displayCount: section.displayCount,
  }).sort((a, b) => a.sortOrder - b.sortOrder);
}

function clampTickerNumber(value: unknown, min: number, max: number, fallback: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(numeric)));
}

function fallbackHomeConfig(): HomeConfig {
  return {
    city: fallbackHomeCity,
    topQuickLinks: fallbackTopQuickLinks,
    banners: fallbackHomeBanners,
    adPlaceholderImageUrl: null,
    tickerItems: fallbackTickerItems,
    tickerSettings: fallbackTickerSettings,
    quickGridItems: fallbackQuickGridItems,
    utilityTools: fallbackUtilityTools,
    latestPostGroups: fallbackLatestPostSections.map((section) => ({ ...section, posts: [] })),
    latestPostsTitle: "最新发布",
    latestPostsVisible: true,
    utilityToolsVisible: true,
    quickGridVisible: true,
    seo: fallbackSeoContent,
  };
}

function warnHomeConfig(source: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[home-config] ${source} fallback used`, error);
  }
}
