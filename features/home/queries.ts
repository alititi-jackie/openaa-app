import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicPosts } from "@/features/posts/queries";
import type { PostType } from "@/features/posts/types";
import { HOME_AD_PLACEMENT, HOME_SECTION_KEYS } from "./constants";
import {
  fallbackHomeBanners,
  fallbackHomeCity,
  fallbackLatestPostSections,
  fallbackQuickGridItems,
  fallbackSeoContent,
  fallbackTickerItems,
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
  const supabase = await createSupabaseServerClient();

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

  return {
    city,
    topQuickLinks: await getTopQuickLinks(supabase, city),
    banners: await getHomeBanners(supabase, city),
    tickerItems: await getLatestTickerItems(supabase, city),
    quickGridItems,
    utilityTools,
    latestPostGroups: await getLatestPostGroups(latestPostSections),
    latestPostsVisible: Boolean(latestSectionConfig?.is_visible ?? true) && latestPostSections.length > 0,
    utilityToolsVisible: Boolean(utilitySectionConfig?.is_visible ?? true) && utilityTools.length > 0,
    quickGridVisible: Boolean(quickGridSectionConfig?.is_visible ?? true) && quickGridItems.length > 0,
    seo: mapSeoContent(seoSectionConfig),
  };
}

export async function getTopQuickLinks(client?: HomeSupabaseClient | null, city = fallbackHomeCity) {
  const supabase = client ?? (await createSupabaseServerClient());

  if (!supabase) {
    return fallbackTopQuickLinks;
  }

  try {
    const { data, error } = await supabase
      .from("top_quick_links")
      .select("id,title,href,icon,sort_order,is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

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
  const supabase = client ?? (await createSupabaseServerClient());

  if (!supabase) {
    return fallbackHomeBanners;
  }

  const banners = await readHomeBanners(supabase, city);

  if (banners.length > 0) {
    return banners;
  }

  const ads = await readHomeAds(supabase);

  return ads.length > 0 ? ads : fallbackHomeBanners;
}

export async function getLatestTickerItems(client?: HomeSupabaseClient | null, city = fallbackHomeCity) {
  const supabase = client ?? (await createSupabaseServerClient());

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

    const items = (data ?? [])
      .map((row) => mapTickerItem({ ...(row as Record<string, unknown>), city_id: city.slug }))
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return items.length > 0 ? items : fallbackTickerItems;
  } catch (error) {
    warnHomeConfig("latest_ticker", error);
    return fallbackTickerItems;
  }
}

export async function getHomeSections(client?: HomeSupabaseClient | null) {
  const supabase = client ?? (await createSupabaseServerClient());

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
      .select("id,title,subtitle,href,is_active,sort_order,starts_at,ends_at,city_id,image_assets(public_url,external_url)")
      .eq("is_active", true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
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
      .select("id,title,href,placement,metadata,is_active,sort_order,starts_at,ends_at,image_assets(public_url,external_url)")
      .eq("placement", HOME_AD_PLACEMENT)
      .eq("is_active", true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
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
  const groups = [];

  for (const section of sections) {
    if (section.postType === "news") {
      groups.push({ ...section, posts: [] });
      continue;
    }

    const result = await getPublicPosts({ type: section.postType as PostType, limit: section.limitCount });
    groups.push({ ...section, posts: result.data });
  }

  return groups;
}

function getVisibleSection(sections: Record<string, HomeSectionRecord>, key: string) {
  const section = sections[key];
  return section?.is_visible === false ? undefined : section;
}

function fallbackHomeConfig(): HomeConfig {
  return {
    city: fallbackHomeCity,
    topQuickLinks: fallbackTopQuickLinks,
    banners: fallbackHomeBanners,
    tickerItems: fallbackTickerItems,
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
