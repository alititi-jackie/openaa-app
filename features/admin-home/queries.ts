import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasAdminPermission } from "@/lib/permissions/admin";
import { getHomeTickerSectionDefaults, homeTickerSections, normalizeHomeTickerSectionKey } from "@/features/home/tickerSections";
import type { AdminHomePermissions, AdminHomeSectionRow, AdminTickerGlobalSettingsRow, AdminTickerRow, AdminTickerSectionSettingsRow, AdminTopQuickLinkRow } from "./types";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export async function getAdminHomeConfigData() {
  const supabase = await createSupabaseServerClient();
  const permissions = await getAdminHomePermissions();

  if (!supabase) {
    return emptyAdminHomeData(permissions);
  }

  const [homeSections, topLinks, tickerItems, tickerGlobalSettings, tickerSectionSettings] = await Promise.all([
    permissions.manageHomeSections ? readHomeSections(supabase) : Promise.resolve([]),
    permissions.manageTopLinks ? readTopLinks(supabase) : Promise.resolve([]),
    permissions.manageLatestTicker ? readTicker(supabase) : Promise.resolve([]),
    permissions.manageLatestTicker ? readTickerGlobalSettings(supabase) : Promise.resolve(defaultTickerGlobalSettings()),
    permissions.manageLatestTicker ? readTickerSectionSettings(supabase) : Promise.resolve(defaultTickerSectionSettings()),
  ]);

  return { permissions, homeSections, topLinks, tickerItems, tickerGlobalSettings, tickerSectionSettings };
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

  const sectionMap = new Map<string, AdminTickerSectionSettingsRow>();
  for (const row of data) {
    const sectionKey = normalizeHomeTickerSectionKey(row.section_key);
    if (!sectionKey || sectionMap.has(sectionKey)) continue;

    const defaults = getHomeTickerSectionDefaults(sectionKey);
    sectionMap.set(sectionKey, {
      section_key: sectionKey,
      section_name: defaults.sectionName,
      is_enabled: row.is_enabled !== false,
      sort_order: clampNumber(row.sort_order, 0, 9999, defaults.sortOrder),
      display_count: clampNumber(row.display_count, 1, 20, defaults.displayCount),
    });
  }

  return homeTickerSections.map((section) => sectionMap.get(section.sectionKey) ?? {
    section_key: section.sectionKey,
    section_name: section.sectionName,
    is_enabled: true,
    sort_order: section.sortOrder,
    display_count: section.displayCount,
  }).sort((a, b) => a.sort_order - b.sort_order);
}

function emptyAdminHomeData(permissions: AdminHomePermissions) {
  return {
    permissions,
    homeSections: [] as AdminHomeSectionRow[],
    topLinks: [] as AdminTopQuickLinkRow[],
    tickerItems: [] as AdminTickerRow[],
    tickerGlobalSettings: defaultTickerGlobalSettings(),
    tickerSectionSettings: defaultTickerSectionSettings(),
  };
}

function defaultTickerGlobalSettings(): AdminTickerGlobalSettingsRow {
  return { is_enabled: true, interval_seconds: 4 };
}

function defaultTickerSectionSettings(): AdminTickerSectionSettingsRow[] {
  return homeTickerSections.map((section) => ({
    section_key: section.sectionKey,
    section_name: section.sectionName,
    is_enabled: true,
    sort_order: section.sortOrder,
    display_count: section.displayCount,
  }));
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(numeric)));
}
