import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasAdminPermission } from "@/lib/permissions/admin";
import type { AdminHomeBannerRow, AdminHomePermissions, AdminHomeSectionRow, AdminTickerRow, AdminTopQuickLinkRow } from "./types";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export async function getAdminHomeConfigData() {
  const supabase = await createSupabaseServerClient();
  const permissions = await getAdminHomePermissions();

  if (!supabase) {
    return emptyAdminHomeData(permissions);
  }

  const [homeSections, topLinks, tickerItems, banners] = await Promise.all([
    permissions.manageHomeSections ? readHomeSections(supabase) : Promise.resolve([]),
    permissions.manageTopLinks ? readTopLinks(supabase) : Promise.resolve([]),
    permissions.manageLatestTicker ? readTicker(supabase) : Promise.resolve([]),
    permissions.manageHomeSections ? readHomeBanners(supabase) : Promise.resolve([]),
  ]);

  return { permissions, homeSections, topLinks, tickerItems, banners };
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
    .select("id,key,title,description,module,config,is_visible,sort_order")
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

async function readHomeBanners(supabase: SupabaseServerClient): Promise<AdminHomeBannerRow[]> {
  const { data, error } = await supabase
    .from("home_banners")
    .select("id,title,subtitle,href,open_mode,image_asset_id,city_id,sort_order,is_active,starts_at,ends_at,image_assets(public_url,external_url)")
    .order("sort_order", { ascending: true });

  if (error) return [];

  return (data ?? []).map((row) => {
    const imageAsset = Array.isArray(row.image_assets) ? row.image_assets[0] : row.image_assets;
    return {
      ...row,
      image_url: imageAsset?.external_url ?? imageAsset?.public_url ?? null,
    } as AdminHomeBannerRow;
  });
}

function emptyAdminHomeData(permissions: AdminHomePermissions) {
  return {
    permissions,
    homeSections: [] as AdminHomeSectionRow[],
    topLinks: [] as AdminTopQuickLinkRow[],
    tickerItems: [] as AdminTickerRow[],
    banners: [] as AdminHomeBannerRow[],
  };
}
