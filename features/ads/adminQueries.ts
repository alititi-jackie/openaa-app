import "server-only";

import { hasAdminPermission } from "@/lib/permissions/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { QueryState } from "@/features/posts/types";
import { getAdPlaceholderSetting } from "./placeholders";
import {
  adPositions,
  adStatusFilters,
  normalizeAdPosition,
  normalizeAdStatusFilter,
  type AdLinkType,
  type AdOpenMode,
  type AdPosition,
  type AdStatusFilter,
  type AdminAdPlaceholder,
  type AdminAdRow,
} from "./types";

export type AdminAdsResult = {
  state: QueryState;
  canManageAds: boolean;
  activePosition: AdPosition;
  activeStatus: AdStatusFilter;
  placeholder: AdminAdPlaceholder;
  ads: AdminAdRow[];
  positionCounts?: Record<AdPosition, number>;
  statusCounts?: Record<AdStatusFilter, number>;
  error?: string;
};

export type AdminAdRecycleBinItem = {
  id: string;
  title: string;
  position: AdPosition;
  positionLabel: string;
  linkType: AdLinkType;
  href: string | null;
  imageAssetId: string | null;
  imageUrl: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
  isActive: boolean;
  createdAt: string;
};

export type AdminAdRecycleBinResult = {
  state: QueryState;
  canManageAds: boolean;
  items: AdminAdRecycleBinItem[];
  error?: string;
};

type RawAdRow = Omit<AdminAdRow, "image_url" | "image_source_type" | "position" | "start_date" | "end_date"> & {
  placement: string;
  href: string | null;
  starts_at: string | null;
  ends_at: string | null;
  image_assets?:
    | { source_type: "storage" | "external" | null; public_url: string | null; external_url: string | null }
    | Array<{ source_type: "storage" | "external" | null; public_url: string | null; external_url: string | null }>
    | null;
};

const emptyPlaceholder: AdminAdPlaceholder = { imageUrl: null, imageAssetId: null, updatedAt: null };
const emptyPositionCounts = Object.fromEntries(adPositions.map((position) => [position.key, 0])) as Record<AdPosition, number>;
const emptyStatusCounts = Object.fromEntries(adStatusFilters.map((status) => [status.key, 0])) as Record<AdStatusFilter, number>;

export async function getAdminAdsData(position?: string, status?: string): Promise<AdminAdsResult> {
  const supabase = await createSupabaseServerClient();
  const canManageAds = await hasAdminPermission("manage_ads");
  const activePosition = normalizeAdPosition(position) ?? "home";
  const activeStatus = normalizeAdStatusFilter(status) ?? "all";

  if (!supabase) {
    return { state: "missing_config", canManageAds, activePosition, activeStatus, placeholder: emptyPlaceholder, ads: [], positionCounts: emptyPositionCounts, statusCounts: emptyStatusCounts };
  }

  if (!canManageAds) {
    return { state: "ready", canManageAds, activePosition, activeStatus, placeholder: emptyPlaceholder, ads: [], positionCounts: emptyPositionCounts, statusCounts: emptyStatusCounts };
  }

  const placeholder = await getAdPlaceholderSetting(supabase);
  const counts = await getAdFilterCounts(supabase, activePosition, activeStatus);

  let query = supabase
    .from("ads")
    .select("id,title,placement,href,image_asset_id,is_active,starts_at,ends_at,sort_order,created_at,link_type,external_url,slug,content,contact_name,phone,wechat,address,open_mode,image_assets(source_type,public_url,external_url)")
    .eq("placement", activePosition)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (activeStatus === "active") query = query.eq("is_active", true);
  if (activeStatus === "inactive") query = query.eq("is_active", false);

  const { data, error } = await query;
  if (error) {
    return { state: "error", canManageAds, activePosition, activeStatus, placeholder, ads: [], error: "广告读取失败，请稍后再试。" };
  }

  return {
    state: "ready",
    canManageAds,
    activePosition,
    activeStatus,
    placeholder,
    positionCounts: counts.positionCounts,
    statusCounts: counts.statusCounts,
    ads: ((data ?? []) as RawAdRow[]).map(mapAd),
  };
}

export async function getAdminAdRecycleBinData(): Promise<AdminAdRecycleBinResult> {
  const supabase = await createSupabaseServerClient();
  const canManageAds = await hasAdminPermission("manage_ads");

  if (!supabase) {
    return { state: "missing_config", canManageAds, items: [] };
  }

  if (!canManageAds) {
    return { state: "ready", canManageAds, items: [] };
  }

  const { data, error } = await supabase
    .from("ads")
    .select("id,title,placement,href,image_asset_id,is_active,created_at,deleted_at,deleted_by,link_type,image_assets(source_type,public_url,external_url)")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false, nullsFirst: false })
    .limit(200);

  if (error) {
    return { state: "error", canManageAds, items: [], error: "已删除广告读取失败，请稍后再试。" };
  }

  return {
    state: "ready",
    canManageAds,
    items: ((data ?? []) as Array<RawAdRow & { deleted_at: string | null; deleted_by: string | null }>).map(mapDeletedAd),
  };
}

async function getAdFilterCounts(supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>, activePosition: AdPosition, activeStatus: AdStatusFilter) {
  const positionCounts = { ...emptyPositionCounts };
  const statusCounts = { ...emptyStatusCounts };

  const { data, error } = await supabase
    .from("ads")
    .select("placement,is_active")
    .is("deleted_at", null);

  if (error) {
    return { positionCounts, statusCounts };
  }

  for (const row of (data ?? []) as Array<{ placement: string | null; is_active: boolean | null }>) {
    const rowPosition = normalizeAdPosition(row.placement);
    if (!rowPosition) continue;

    const rowStatus: Exclude<AdStatusFilter, "all"> = row.is_active === false ? "inactive" : "active";
    if (activeStatus === "all" || activeStatus === rowStatus) {
      positionCounts[rowPosition] += 1;
    }

    if (rowPosition === activePosition) {
      statusCounts.all += 1;
      statusCounts[rowStatus] += 1;
    }
  }

  return { positionCounts, statusCounts };
}

function mapAd(row: RawAdRow): AdminAdRow {
  const imageAsset = Array.isArray(row.image_assets) ? row.image_assets[0] : row.image_assets;
  const linkType: AdLinkType = row.link_type === "internal" ? "internal" : "external";
  const openMode: AdOpenMode = row.open_mode === "internal" || row.open_mode === "external_same" ? row.open_mode : "external_new";
  const position = normalizeAdPosition(row.placement) ?? "home";
  const externalUrl = row.external_url || (linkType === "external" ? row.href : null);

  return {
    id: row.id,
    title: row.title,
    image_asset_id: row.image_asset_id,
    image_url: imageAsset?.public_url || imageAsset?.external_url || null,
    image_source_type: imageAsset?.source_type ?? null,
    link_url: row.href,
    link_type: linkType,
    external_url: externalUrl,
    slug: row.slug,
    content: row.content,
    contact_name: row.contact_name,
    phone: row.phone,
    wechat: row.wechat,
    address: row.address,
    open_mode: openMode,
    position,
    is_active: row.is_active,
    start_date: row.starts_at,
    end_date: row.ends_at,
    sort_order: row.sort_order,
    created_at: row.created_at,
  };
}

function mapDeletedAd(row: RawAdRow & { deleted_at: string | null; deleted_by: string | null }): AdminAdRecycleBinItem {
  const imageAsset = Array.isArray(row.image_assets) ? row.image_assets[0] : row.image_assets;
  const position = normalizeAdPosition(row.placement) ?? "home";
  const positionLabel = adPositions.find((item) => item.key === position)?.label ?? position;

  return {
    id: row.id,
    title: row.title,
    position,
    positionLabel,
    linkType: row.link_type === "internal" ? "internal" : "external",
    href: row.href,
    imageAssetId: row.image_asset_id,
    imageUrl: imageAsset?.public_url || imageAsset?.external_url || null,
    deletedAt: row.deleted_at,
    deletedBy: row.deleted_by,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}
