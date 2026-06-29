import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { LatestPostGroup } from "@/components/home/LatestPostsSection";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { getAdPlaceholderSetting } from "@/features/ads/placeholders";
import { fallbackLatestNewsCategories, fallbackLatestPostSections, fallbackHomeBanners, fallbackHomeCity, fallbackQuickGridItems, fallbackSeoContent, fallbackTickerItems, fallbackTickerSettings, fallbackTopQuickLinks, fallbackUtilityTools } from "./fallbacks";
import { getHomeTickerSectionDefaults, homeTickerSections, normalizeHomeTickerSectionKey } from "./tickerSections";
import type { PostListItem } from "@/components/posts/PostList";
import { DEFAULT_CITY_SLUG } from "@/features/posts/constants";
import { mapPostRecordToCard } from "@/features/posts/mappers";
import type { PostRecord, PostType } from "@/features/posts/types";
import { NEWS_DEFAULT_DESCRIPTION } from "@/features/news/constants";
import { formatNewsDate } from "@/features/news/mappers";
import type { NewsCategoryRecord, NewsImageAsset } from "@/features/news/types";
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
const HOME_CACHE_BUCKET_MS = 5 * 60 * 1000;
const HOME_CARD_DESCRIPTION_MAX_LENGTH = 120;

const homePostSelect = `
  id,
  post_type,
  author_id,
  title,
  summary,
  category,
  subcategory,
  status,
  visibility,
  price_amount,
  currency,
  metadata,
  is_pinned,
  pinned_order,
  pinned_until,
  published_at,
  expires_at,
  created_at,
  updated_at,
  post_stats(view_count, favorite_count),
  post_images(
    id,
    image_asset_id,
    sort_order,
    is_cover,
    caption,
    image_assets(public_url, external_url)
  ),
  post_details_jobs(employment_type, wage_min, wage_max, wage_unit, job_category, work_area),
  post_details_housing(listing_type, housing_type, rent_amount, available_date, lease_term, address_area),
  post_details_marketplace(listing_type, item_category, price_amount, trade_area, sold_at),
  post_details_services(service_category, service_area, price_range, service_status),
  cities!inner(name, slug)
`;

const homeNewsPostSelect = `
  id,
  category_id,
  title,
  slug,
  excerpt,
  status,
  is_pinned,
  pinned_order,
  pinned_until,
  published_at,
  created_at,
  updated_at,
  news_categories(id,slug,name,description,sort_order,is_active),
  image_assets(source_type,bucket,path,storage_path,public_url,external_url,status,is_deleted)
`;

const homeNewsPostCategoryInnerSelect = homeNewsPostSelect.replace(
  "news_categories(id,slug,name,description,sort_order,is_active)",
  "news_categories!inner(id,slug,name,description,sort_order,is_active)",
);

type HomeNewsPostRecord = {
  id: string;
  category_id: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  is_pinned: boolean | null;
  pinned_order: number | null;
  pinned_until?: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  news_categories?: NewsCategoryRecord | NewsCategoryRecord[] | null;
  image_assets?: NewsImageAsset | NewsImageAsset[] | null;
};

function homeCacheNowIso() {
  return new Date(Math.floor(Date.now() / HOME_CACHE_BUCKET_MS) * HOME_CACHE_BUCKET_MS).toISOString();
}

export async function getHomeConfig(): Promise<HomeConfig> {
  const supabase = createSupabasePublicClient({ revalidate: 300, timeoutMs: HOME_PUBLIC_FETCH_TIMEOUT_MS });

  if (!supabase) {
    return fallbackHomeConfig();
  }

  const now = homeCacheNowIso();
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
    getHomeBanners(supabase, now),
    getAdPlaceholderSetting(supabase),
    getLatestPostGroups(latestPostSections, supabase, now),
  ]);
  const tickerPostGroups = await getTickerPostGroups(latestPostSections, tickerSettings, latestPostGroups, supabase, now);
  const tickerItems = await getLatestTickerItems(supabase, city, tickerSettings, tickerPostGroups, now);

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

export async function getHomeBanners(client?: HomeSupabaseClient | null, now = homeCacheNowIso()) {
  const supabase = client ?? createSupabasePublicClient();

  if (!supabase) {
    return fallbackHomeBanners;
  }

  const ads = await readHomeAds(supabase, now);
  if (ads.length > 0) return ads;
  return fallbackHomeBanners;
}

export async function getLatestTickerItems(
  client?: HomeSupabaseClient | null,
  city = fallbackHomeCity,
  settings = fallbackTickerSettings,
  latestPostGroups?: LatestPostGroup[],
  now = homeCacheNowIso(),
) {
  const supabase = client ?? createSupabasePublicClient();

  if (!settings.global.isEnabled) {
    return [];
  }

  if (supabase) {
    const configuredItems = await getConfiguredTickerItems(supabase, city, now);
    const dynamicItems = latestPostGroups
      ? mapLatestPostGroupsToTickerItems(latestPostGroups, settings)
      : mapLatestPostGroupsToTickerItems(await getTickerPostGroups(fallbackLatestPostSections.filter((section) => section.isVisible), settings, undefined, supabase, now), settings);

    const combinedItems = [...configuredItems, ...dynamicItems];
    if (combinedItems.length > 0) {
      return combinedItems;
    }
  }

  const dynamicItems = latestPostGroups
    ? mapLatestPostGroupsToTickerItems(latestPostGroups, settings)
    : mapLatestPostGroupsToTickerItems(await getTickerPostGroups(fallbackLatestPostSections.filter((section) => section.isVisible), settings, undefined, supabase, now), settings);

  if (dynamicItems.length > 0) {
    return dynamicItems;
  }

  if (!supabase) {
    return fallbackTickerItems;
  }

  return [];
}

async function getConfiguredTickerItems(supabase: HomeSupabaseClient, city = fallbackHomeCity, now = homeCacheNowIso()) {
  try {
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

async function readHomeAds(supabase: HomeSupabaseClient, now = homeCacheNowIso()) {
  try {
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

async function getLatestPostGroups(sections: HomeLatestPostSectionConfig[], client?: HomeSupabaseClient | null, now = homeCacheNowIso()) {
  return Promise.all(sections.map((section) => getLatestPostGroup(section, client, now)));
}

async function getLatestPostGroup(section: HomeLatestPostSectionConfig, client?: HomeSupabaseClient | null, now = homeCacheNowIso()): Promise<LatestPostGroup> {
  try {
    if (section.postType === "news") {
      const posts = await getLatestNewsForHomeSection(section, client, now);
      return { ...section, posts };
    }

    const supabase = client ?? createSupabasePublicClient();
    if (!supabase) return { ...section, posts: [] };

    const posts = await getLatestHomePosts(supabase, section.postType as PostType, section.limitCount, now);
    return { ...section, posts };
  } catch (error) {
    warnHomeConfig(`latest_posts.${section.key}`, error);
    return { ...section, posts: [] };
  }
}

async function getLatestHomePosts(supabase: HomeSupabaseClient, type: PostType, limit: number, now = homeCacheNowIso()): Promise<PostListItem[]> {
  const safeLimit = normalizeHomeLimit(limit);
  const [pinnedResult, normalResult] = await Promise.all([
    buildHomePostQuery(supabase, type, now)
      .eq("is_pinned", true)
      .or(`pinned_until.is.null,pinned_until.gt.${now}`)
      .order("pinned_order", { ascending: true })
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(safeLimit),
    buildHomePostQuery(supabase, type, now)
      .or(`is_pinned.eq.false,pinned_until.lte.${now}`)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(safeLimit),
  ]);

  if (pinnedResult.error) {
    throw new Error(`get home pinned posts failed: ${pinnedResult.error.message}`);
  }

  if (normalResult.error) {
    throw new Error(`get home normal posts failed: ${normalResult.error.message}`);
  }

  const records = [...((pinnedResult.data ?? []) as unknown as PostRecord[]), ...((normalResult.data ?? []) as unknown as PostRecord[])];
  return records.sort(compareHomePostRecords).slice(0, safeLimit).map(mapHomePostRecordToCard);
}

function buildHomePostQuery(supabase: HomeSupabaseClient, type: PostType, now = homeCacheNowIso()) {
  return supabase
    .from("posts")
    .select(homePostSelect)
    .eq("post_type", type)
    .eq("status", "published")
    .eq("visibility", "public")
    .eq("cities.slug", DEFAULT_CITY_SLUG)
    .or(`expires_at.is.null,expires_at.gt.${now}`);
}

async function getLatestNewsForHomeSection(section: HomeLatestPostSectionConfig, client?: HomeSupabaseClient | null, now = homeCacheNowIso()): Promise<PostListItem[]> {
  const categories = (section.newsCategories ?? fallbackLatestNewsCategories)
    .filter((category) => category.isVisible !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (categories.length === 0) {
    return [];
  }

  const supabase = client ?? createSupabasePublicClient();
  if (!supabase) return [];

  const lists = await Promise.all(
    categories.map((category) => getLatestHomeNewsByCategory(supabase, category.categorySlug, category.limitCount, now)),
  );
  const seen = new Set<string>();
  const posts: PostListItem[] = [];

  for (const list of lists) {
    for (const post of list) {
      const id = post.id ?? post.href;
      if (seen.has(id)) continue;
      seen.add(id);
      posts.push(post);
    }
  }

  return posts;
}

async function getLatestHomeNewsByCategory(supabase: HomeSupabaseClient, categorySlug: string, limit: number, now = homeCacheNowIso()): Promise<PostListItem[]> {
  const safeLimit = normalizeHomeLimit(limit);
  const { data, error } = await supabase
    .from("news_posts")
    .select(homeNewsPostCategoryInnerSelect)
    .eq("status", "published")
    .eq("news_categories.slug", categorySlug)
    .or(`published_at.is.null,published_at.lte.${now}`)
    .order("is_pinned", { ascending: false })
    .order("pinned_order", { ascending: true })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw new Error(`get home news failed: ${error.message}`);
  }

  return ((data ?? []) as unknown as HomeNewsPostRecord[]).sort(compareHomeNewsRecords).slice(0, safeLimit).map(mapHomeNewsRecordToPost);
}

async function getTickerPostGroups(
  sections: HomeLatestPostSectionConfig[],
  settings = fallbackTickerSettings,
  existingGroups?: LatestPostGroup[],
  client?: HomeSupabaseClient | null,
  now = homeCacheNowIso(),
) {
  const tickerSections = expandTickerPostSectionLimits(sections, settings);
  if (tickerSections.length === 0) return [];

  if (existingGroups && canReuseLatestPostGroupsForTicker(tickerSections, existingGroups)) {
    return existingGroups;
  }

  return getLatestPostGroups(tickerSections, client, now);
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

function mapHomeNewsRecordToPost(record: HomeNewsPostRecord): PostListItem {
  const post = {
    id: record.id,
    title: record.title,
    excerpt: truncateHomeDescription(record.excerpt || NEWS_DEFAULT_DESCRIPTION),
    href: `/news/${record.slug}`,
    publishedAt: record.published_at,
    updatedAt: record.updated_at,
    isPinned: isHomeNewsPinned(record),
    pinnedOrder: record.pinned_order ?? 0,
    categoryName: homeNewsCategoryName(record),
    coverImageUrl: homeNewsImageUrl(record),
  };

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

function mapHomePostRecordToCard(record: PostRecord): PostListItem {
  const card = mapPostRecordToCard({ ...record, body: null }, {});
  const homeCard: PostListItem = { ...card };
  delete homeCard.displayBody;

  return {
    ...homeCard,
    description: truncateHomeDescription(card.description),
    tickerSortAt: card.publishedAt || card.createdAt,
  };
}

function compareHomePostRecords(a: PostRecord, b: PostRecord) {
  const aPinned = isHomePostPinned(a);
  const bPinned = isHomePostPinned(b);
  if (aPinned !== bPinned) return aPinned ? -1 : 1;
  if (aPinned && bPinned && (a.pinned_order ?? 0) !== (b.pinned_order ?? 0)) {
    return (a.pinned_order ?? 0) - (b.pinned_order ?? 0);
  }
  return dateValue(b.published_at || b.created_at) - dateValue(a.published_at || a.created_at);
}

function compareHomeNewsRecords(a: HomeNewsPostRecord, b: HomeNewsPostRecord) {
  const aPinned = isHomeNewsPinned(a);
  const bPinned = isHomeNewsPinned(b);
  if (aPinned !== bPinned) return aPinned ? -1 : 1;
  if (aPinned && bPinned && (a.pinned_order ?? 0) !== (b.pinned_order ?? 0)) {
    return (a.pinned_order ?? 0) - (b.pinned_order ?? 0);
  }
  return dateValue(b.published_at || b.created_at) - dateValue(a.published_at || a.created_at);
}

function isHomePostPinned(record: PostRecord) {
  if (!record.is_pinned) return false;
  if (!record.pinned_until) return true;
  return dateValue(record.pinned_until) > Date.now();
}

function isHomeNewsPinned(record: HomeNewsPostRecord) {
  if (!record.is_pinned) return false;
  if (!record.pinned_until) return true;
  return dateValue(record.pinned_until) > Date.now();
}

function normalizeHomeLimit(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(20, Math.max(1, Math.trunc(value)));
}

function truncateHomeDescription(value?: string | null) {
  const text = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (!text) return "";
  if (text.length <= HOME_CARD_DESCRIPTION_MAX_LENGTH) return text;
  return `${text.slice(0, HOME_CARD_DESCRIPTION_MAX_LENGTH).trimEnd()}...`;
}

function firstOrNull<T>(value: T[] | T | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function homeNewsCategoryName(record: HomeNewsPostRecord) {
  return firstOrNull(record.news_categories)?.name ?? "News";
}

function cleanHomeUrl(value: string | null | undefined) {
  const url = typeof value === "string" ? value.trim() : "";
  return url.length > 0 ? url : null;
}

function homeNewsStorageUrl(asset: NewsImageAsset) {
  const baseUrl = cleanHomeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const bucket = cleanHomeUrl(asset.bucket);
  const path = cleanHomeUrl(asset.path) ?? cleanHomeUrl(asset.storage_path);

  if (!baseUrl || !bucket || !path) return null;
  return `${baseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${bucket}/${path.replace(/^\/+/, "")}`;
}

function homeNewsImageUrl(record: HomeNewsPostRecord) {
  const asset = firstOrNull(record.image_assets);
  if (!asset || asset.is_deleted || (asset.status && asset.status !== "active")) return null;
  return cleanHomeUrl(asset.public_url) ?? cleanHomeUrl(asset.external_url) ?? homeNewsStorageUrl(asset);
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
