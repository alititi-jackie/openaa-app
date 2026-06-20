import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabasePublicClient } from "@/lib/supabase/public";
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

export async function getHomeConfig(): Promise<HomeConfig> {
  const supabase = createSupabasePublicClient();

  if (!supabase) {
    return fallbackHomeConfig();
  }

  const city = await getDefaultCity(supabase);
  const sections = await getHomeSections(supabase);
  const latestSectionConfig = getVisibleSection(sections, HOME_SECTION_KEYS.latestPosts);
  const utilitySectionConfig = getVisibleSection(sections, HOME_SECTION_KEYS.utilityTools);
  const quickGridSectionConfig = getVisibleSection(sections, HOME_SECTION_KEYS.quickGrid);
  const seoSectionConfig = getVisibleSection(sections, HOME_SECTION_KEYS.seoContent);

  const latestPostSections = mapLatestPostSections(latestSectionConfig).filter((section) => section.isVisible);
  const quickGridItems = mapQuickGridItems(quickGridSectionConfig);
  const utilityTools = mapUtilityTools(utilitySectionConfig).filter((item) => item.isVisible !== false);
  const tickerSettings = await getLatestTickerSettings(supabase);
  const [topQuickLinks, banners, tickerItems, latestPostGroups] = await Promise.all([
    getTopQuickLinks(supabase, city),
    getHomeBanners(supabase, city),
    getLatestTickerItems(supabase, city, tickerSettings),
    getLatestPostGroups(latestPostSections),
  ]);

  return {
    city,
    topQuickLinks,
    banners,
    tickerItems,
    tickerSettings,
    quickGridItems,
    utilityTools,
    latestPostGroups,
    latestPostsVisible: Boolean(latestSectionConfig?.is_visible ?? true) && latestPostSections.length > 0,
    utilityToolsVisible: Boolean(utilitySectionConfig?.is_visible ?? true) && utilityTools.length > 0,
    quickGridVisible: Boolean(quickGridSectionConfig?.is_visible ?? true) && quickGridItems.length > 0,
    seo: mapSeoContent(seoSectionConfig),
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

export async function getLatestTickerItems(client?: HomeSupabaseClient | null, city = fallbackHomeCity, settings = fallbackTickerSettings) {
  const supabase = client ?? createSupabasePublicClient();

  if (!settings.global.isEnabled) {
    return [];
  }

  if (!supabase) {
    return fallbackTickerItems;
  }

  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("latest_ticker")
      .select("id,title,href,is_enabled,sort_order,starts_at,ends_at")
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

    return items.length > 0 ? items : fallbackTickerItems;
  } catch (error) {
    warnHomeConfig("latest_ticker", error);
    return fallbackTickerItems;
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
  return mapUtilityTools(getVisibleSection(sections, HOME_SECTION_KEYS.utilityTools));
}

export async function getLatestPostSections() {
  const sections = await getHomeSections();
  return mapLatestPostSections(getVisibleSection(sections, HOME_SECTION_KEYS.latestPosts)).filter((section) => section.isVisible);
}

export async function getHomeSeoContent() {
  const sections = await getHomeSections();
  return mapSeoContent(getVisibleSection(sections, HOME_SECTION_KEYS.seoContent));
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

async function getLatestPostGroups(sections: HomeLatestPostSectionConfig[]) {
  return Promise.all(sections.map(async (section) => {
    if (section.postType === "news") {
      const result = await getLatestNews(section.limitCount);
      return { ...section, posts: result.data.map(mapNewsToHomePost) };
    }

    const result = await getPublicPosts({ type: section.postType as PostType, limit: section.limitCount });
    return { ...section, posts: result.data };
  }));
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
    imageUrl: post.coverImageUrl ?? undefined,
    fields: post.isPinned ? [{ label: "pinned", value: "置顶" }] : undefined,
  };
}

function getVisibleSection(sections: Record<string, HomeSectionRecord>, key: string) {
  const section = sections[key];
  return section?.is_visible === false ? undefined : section;
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
  if (module === "secondhand") return "marketplace";
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
    tickerItems: fallbackTickerItems,
    tickerSettings: fallbackTickerSettings,
    quickGridItems: fallbackQuickGridItems,
    utilityTools: fallbackUtilityTools,
    latestPostGroups: fallbackLatestPostSections.map((section) => ({ ...section, posts: [] })),
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
