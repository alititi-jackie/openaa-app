import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasAdminPermission } from "@/lib/permissions/admin";
import type { AdminHomeBannerRow, AdminHomePermissions, AdminHomeSectionRow, AdminTickerGlobalSettingsRow, AdminTickerRow, AdminTickerSectionSettingsRow, AdminTopQuickLinkRow } from "./types";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export async function getAdminHomeConfigData(bannerStatus?: string) {
  const supabase = await createSupabaseServerClient();
  const permissions = await getAdminHomePermissions();

  if (!supabase) {
    return emptyAdminHomeData(permissions);
  }

  const [homeSections, topLinks, tickerItems, tickerGlobalSettings, tickerSectionSettings, banners] = await Promise.all([
    permissions.manageHomeSections ? readHomeSections(supabase) : Promise.resolve([]),
    permissions.manageTopLinks ? readTopLinks(supabase) : Promise.resolve([]),
    permissions.manageLatestTicker ? readTicker(supabase) : Promise.resolve([]),
    permissions.manageLatestTicker ? readTickerGlobalSettings(supabase) : Promise.resolve(defaultTickerGlobalSettings()),
    permissions.manageLatestTicker ? readTickerSectionSettings(supabase) : Promise.resolve(defaultTickerSectionSettings()),
    permissions.manageHomeSections ? readHomeBanners(supabase, bannerStatus) : Promise.resolve([]),
  ]);

  return { permissions, homeSections, topLinks, tickerItems, tickerGlobalSettings, tickerSectionSettings, banners };
}

export async function getAdminTopLinksData() {
  const supabase = await createSupabaseServerClient();
  const permissions = await getAdminHomePermissions();

  if (!supabase || !permissions.manageTopLinks) {
    return { permissions, topLinks: [] as AdminTopQuickLinkRow[] };
  }

  return { permissions, topLinks: await readTopLinks(supabase) };
}

export async function getAdminHomePermissions(): Promise<AdminHomePermissions> {
  const [manageHomeSections, manageTopLinks, manageLatestTicker, manageAds] = await Promise.all([
    hasAdminPermission("manage_home_sections"),
    hasAdminPermission("manage_top_links"),
    hasAdminPermission("manage_latest_ticker"),
    hasAdminPermission("manage_ads"),
  ]);

  return { manageHomeSections, manageTopLinks, manageLatestTicker, manageAds };
}

async function readHomeSections(supabase: SupabaseServerClient): Promise<AdminHomeSectionRow[]> {
  const { data, error } = await supabase
    .from("home_sections")
    .select("key,title,description,module,config,is_visible,sort_order")
    .order("sort_order", { ascending: true });

  if (error) return [];
  return (data ?? []) as AdminHomeSectionRow[];
}

async function readTopLinks(supabase: SupabaseServerClient): Promise<AdminTopQuickLinkRow[]> {
  const { data, error } = await supabase
    .from("top_quick_links")
    .select("id,key,title,href,open_mode,icon,sort_order,is_active,city_id")
    .order("sort_order", { ascending: true });

  if (error) return [];
  return (data ?? []) as AdminTopQuickLinkRow[];
}

async function readTicker(supabase: SupabaseServerClient): Promise<AdminTickerRow[]> {
  const { data, error } = await supabase
    .from("latest_ticker")
    .select("id,title,href,module,is_enabled,sort_order,starts_at,ends_at")
    .order("sort_order", { ascending: true });

  if (error) return [];
  return (data ?? []) as AdminTickerRow[];
}

async function readTickerGlobalSettings(supabase: SupabaseServerClient): Promise<AdminTickerGlobalSettingsRow> {
  const { data, error } = await supabase.from("latest_ticker_global_settings").select("is_enabled,interval_seconds").eq("id", 1).maybeSingle();

  if (error || !data) return defaultTickerGlobalSettings();
  return {
    is_enabled: data.is_enabled !== false,
    interval_seconds: clampNumber(data.interval_seconds, 3, 10, 4),
  };
}

async function readTickerSectionSettings(supabase: SupabaseServerClient): Promise<AdminTickerSectionSettingsRow[]> {
  const { data, error } = await supabase
    .from("latest_ticker_sections")
    .select("section_key,section_name,is_enabled,sort_order,display_count")
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) return defaultTickerSectionSettings();
  return data.map((row) => ({
    section_key: String(row.section_key),
    section_name: String(row.section_name),
    is_enabled: row.is_enabled !== false,
    sort_order: clampNumber(row.sort_order, 0, 9999, 0),
    display_count: clampNumber(row.display_count, 1, 20, 3),
  }));
}

async function readHomeBanners(supabase: SupabaseServerClient, status?: string): Promise<AdminHomeBannerRow[]> {
  const { data, error } = await supabase
    .from("home_banners")
    .select("id,title,subtitle,href,open_mode,image_asset_id,city_id,sort_order,is_active,starts_at,ends_at,image_assets(source_type,public_url,external_url)")
    .order("sort_order", { ascending: true });

  if (error) return [];

  const banners = (data ?? []).map((row) => {
    const imageAsset = Array.isArray(row.image_assets) ? row.image_assets[0] : row.image_assets;
    return {
      ...row,
      image_url: imageAsset?.external_url ?? imageAsset?.public_url ?? null,
      image_source_type: imageAsset?.source_type ?? null,
      computed_status: getBannerComputedStatus(row),
    } as AdminHomeBannerRow;
  });

  return status && status !== "all" ? banners.filter((banner) => banner.computed_status === status) : banners;
}

function emptyAdminHomeData(permissions: AdminHomePermissions) {
  return {
    permissions,
    homeSections: [] as AdminHomeSectionRow[],
    topLinks: [] as AdminTopQuickLinkRow[],
    tickerItems: [] as AdminTickerRow[],
    tickerGlobalSettings: defaultTickerGlobalSettings(),
    tickerSectionSettings: defaultTickerSectionSettings(),
    banners: [] as AdminHomeBannerRow[],
  };
}

function defaultTickerGlobalSettings(): AdminTickerGlobalSettingsRow {
  return { is_enabled: true, interval_seconds: 4 };
}

function defaultTickerSectionSettings(): AdminTickerSectionSettingsRow[] {
  return [
    { section_key: "news", section_name: "新闻", is_enabled: true, sort_order: 10, display_count: 5 },
    { section_key: "jobs", section_name: "招聘", is_enabled: true, sort_order: 20, display_count: 3 },
    { section_key: "housing", section_name: "房屋", is_enabled: true, sort_order: 30, display_count: 3 },
    { section_key: "marketplace", section_name: "二手 / 市场", is_enabled: true, sort_order: 40, display_count: 3 },
    { section_key: "services", section_name: "本地服务", is_enabled: true, sort_order: 50, display_count: 3 },
  ];
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(numeric)));
}

function getBannerComputedStatus(row: { is_active: boolean; starts_at: string | null; ends_at: string | null }): AdminHomeBannerRow["computed_status"] {
  if (!row.is_active) return "inactive";
  const now = Date.now();
  const startsAt = row.starts_at ? new Date(row.starts_at).getTime() : null;
  const endsAt = row.ends_at ? new Date(row.ends_at).getTime() : null;

  if (startsAt && startsAt > now) return "scheduled";
  if (endsAt && endsAt < now) return "expired";
  return "active";
}
