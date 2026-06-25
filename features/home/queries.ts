import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { LatestPostGroup } from "@/components/home/LatestPostsSection";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { getAdPlaceholderSetting } from "@/features/ads/placeholders";
import type { PostListItem } from "@/components/posts/PostList";
import { getPublicPosts } from "@/features/posts/queries";
import type { PostType } from "@/features/posts/types";
import { getLatestNews } from "@/features/news/queries";
import { formatNewsDate } from "@/features/news/mappers";
import { HOME_AD_PLACEMENT, HOME_SECTION_KEYS } from "./constants";
import {
  fallbackHomeBanners,
  fallbackHomeCity,
  fallbackLatestPostSections,
  fallbackQuickGridItems,
  fallbackSeoContent,
  fallbackTickerItems,
  fallbackTickerSettings,
  fallbackTopQuickLinks,
  fallbackUtilityTools,
} from "./fallbacks";
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
import type { HomeCity, HomeConfig, HomeLatestPostSectionConfig, HomeSectionRecord } from "./types";

type HomeSupabaseClient = SupabaseClient;

const MAX_DYNAMIC_TICKER_ITEMS = 10;
const MAX_DYNAMIC_TICKER_ITEMS_PER_SECTION = 2;
const HOME_PUBLIC_FETCH_TIMEOUT_MS = 8000;

export async function getHomeConfig(): Promise<HomeConfig> {
  const supabase = createSupabasePublicClient({ cache: "no-store", timeoutMs: HOME_PUBLIC_FETCH_TIMEOUT_MS });

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
    getHomeBanners(supabase, city),
    getAdPlaceholderSetting(supabase),
    getLatestPostGroups(latestPostSections, supabase),
  ]);
  const tickerItems = await getLatestTickerItems(supabase, city, tickerSettings, latestPostGroups);

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

export async function getHomeBanners(client?: HomeSupabaseClient | null, city = fallbackHomeCity) {
  const supabase = client ?? createSupabasePublicClient();

  if (!supabase) {
    return fallbackHomeBanners;
  }

  const ads = await readHomeAds(supabase);

  if (ads.length > 0) {
    return ads;
  }

  const banners = await readHomeBanners(supabase, city);

  return banners.length > 0 ? banners : fallbackHomeBanners;
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

  const dynamicItems = latestPostGroups
    ? mapLatestPostGroupsToTickerItems(latestPostGroups, settings)
    : mapLatestPostGroupsToTickerItems(await getLatestPostGroups(fallbackLatestPostSections.filter((section) => section.isVisible), supabase), settings);

  if (dynamicItems.length > 0) {
    return dynamicItems;
  }

  if (!supabase) {
    return fallbackTickerItems;
  }

  const configuredItems = await getConfiguredTickerItems(supabase, city, settings);
  return configuredItems.length > 0 ? configuredItems : fallbackTickerItems;
}

async function getConfiguredTickerItems(supabase: HomeSupabaseClient, city = fallbackHomeCity, settings = fallbackTickerSettings) {
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
      return fallbackTickerItems;
    }

    const items = applyTickerSectionSettings(
      (data ?? [])
      .map((row) => mapTickerItem({ ...(row as Record<string, unknown>), city_id: city.slug }))
      .filter((item): item is NonNullable<typeof item> => item !== null),
      settings,
    );

    return items;
  } catch (error) {
    warnHomeConfig("latest_ticker", error);
    return [];
  }
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
      sections:
        sections && sections.length > 0
          ? sections.map((section) => ({
              sectionKey: String(section.section_key),
              sectionName: String(section.section_name),
              isEnabled: section.is_enabled !== false,
              sortOrder: clampTickerNumber(section.sort_order, 0, 9999, 0),
              displayCount: clampTickerNumber(section.display_count, 1, 20, 3),
            }))
          : fallbackTickerSettings.sections,
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

async function readHomeBanners(supabase: HomeSupabaseClient, city: HomeCity) {
  try {
    const now = new Date().toISOString();
    let query = supabase
      .from("home_banners")
      .select("id,title,subtitle,href,open_mode,is_active,sort_order,starts_at,ends_at,city_id,image_assets(public_url,external_url)")
      .eq("is_active", true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .order("sort_order", { ascending: true });

    if (city.id) {
      query = query.or(`city_id.is.null,city_id.eq.${city.id}`);
    }

    const { data, error } = await query;

    if (error) {
      warnHomeConfig("home_banners", error.message);
      return [];
    }

    return (data ?? [])
      .map((row) => mapBanner(row as Record<string, unknown>))
      .filter((item): item is NonNullable<typeof item> => item !== null);
  } catch (error) {
    warnHomeConfig("home_banners", error);
    return [];
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
      const result = await getLatestNews(section.limitCount, client ?? undefined);
      return { ...section, posts: result.data.map(mapNewsToHomePost) };
    }

    const result = await getPublicPosts({ type: section.postType as PostType, limit: section.limitCount, client: client ?? undefined });
    return { ...section, posts: result.data };
  } catch (error) {
    warnHomeConfig(`latest_posts.${section.key}`, error);
    return { ...section, posts: [] };
  }
}

function mapNewsToHomePost(post: Awaited<ReturnType<typeof getLatestNews>>["data"][number]): PostListItem {
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
  const enabledSectionKeys = new Set(
    settings.sections
      .filter((section) => section.isEnabled)
      .map((section) => section.sectionKey),
  );
  const hasSectionSettings = settings.sections.length > 0;
  const candidates = groups
    .filter((group) => group.isVisible !== false)
    .filter((group) => !hasSectionSettings || enabledSectionKeys.has(normalizeTickerModule(group.key)))
    .flatMap((group) =>
      group.posts
        .map((post) => mapLatestPostToTickerCandidate(group, post))
        .filter((item): item is TickerCandidate => item !== null)
        .sort(compareTickerCandidates)
        .slice(0, MAX_DYNAMIC_TICKER_ITEMS_PER_SECTION),
    )
    .sort(compareTickerCandidates)
    .slice(0, MAX_DYNAMIC_TICKER_ITEMS);

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
  const channel = group.navLabel || group.title;
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

function applyTickerSectionSettings<T extends { module?: string | null }>(items: T[], settings = fallbackTickerSettings) {
  const sections = settings.sections
    .filter((section) => section.isEnabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (sections.length === 0) {
    return items;
  }

  const configuredKeys = new Set(sections.map((section) => section.sectionKey));
  const result: T[] = [];

  for (const section of sections) {
    const sectionItems = items.filter((item) => normalizeTickerModule(item.module) === section.sectionKey);
    result.push(...sectionItems.slice(0, section.displayCount));
  }

  result.push(...items.filter((item) => !configuredKeys.has(normalizeTickerModule(item.module))));
  return result;
}

function normalizeTickerModule(module?: string | null) {
  if (module === "marketplace") return "marketplace";
  return module ?? "";
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
