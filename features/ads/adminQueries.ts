import "server-only";

import { hasAdminPermission } from "@/lib/permissions/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { QueryState } from "@/features/posts/types";
import { normalizeAdPosition, normalizeAdStatusFilter, type AdLinkType, type AdPosition, type AdStatusFilter, type AdOpenMode, type AdminAdRow } from "./types";

export type AdminAdsResult = {
  state: QueryState;
  canManageAds: boolean;
  activePosition: AdPosition;
  activeStatus: AdStatusFilter;
  ads: AdminAdRow[];
  error?: string;
};

type RawAdRow = Omit<AdminAdRow, "image_url" | "image_source_type" | "position" | "start_date" | "end_date"> & {
  placement: string;
  href: string | null;
  starts_at: string | null;
  ends_at: string | null;
  image_assets?: { source_type: "storage" | "external" | null; public_url: string | null; external_url: string | null } | Array<{ source_type: "storage" | "external" | null; public_url: string | null; external_url: string | null }> | null;
};

export async function getAdminAdsData(position?: string, status?: string): Promise<AdminAdsResult> {
  const supabase = await createSupabaseServerClient();
  const canManageAds = await hasAdminPermission("manage_ads");
  const activePosition = normalizeAdPosition(position) ?? "home";
  const activeStatus = normalizeAdStatusFilter(status) ?? "all";

  if (!supabase) {
    return { state: "missing_config", canManageAds, activePosition, activeStatus, ads: [] };
  }

  if (!canManageAds) {
    return { state: "ready", canManageAds, activePosition, activeStatus, ads: [] };
  }

  let query = supabase
    .from("ads")
    .select("id,placement,href,image_asset_id,is_active,starts_at,ends_at,sort_order,created_at,link_type,external_url,slug,content,contact_name,phone,wechat,open_mode,image_assets(source_type,public_url,external_url)")
    .eq("placement", activePosition)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (activeStatus === "active") query = query.eq("is_active", true);
  if (activeStatus === "inactive") query = query.eq("is_active", false);

  const { data, error } = await query;
  if (error) {
    return { state: "error", canManageAds, activePosition, activeStatus, ads: [], error: "广告读取失败，请稍后再试。" };
  }

  return {
    state: "ready",
    canManageAds,
    activePosition,
    activeStatus,
    ads: ((data ?? []) as RawAdRow[]).map(mapAd),
  };
}

function mapAd(row: RawAdRow): AdminAdRow {
  const imageAsset = Array.isArray(row.image_assets) ? row.image_assets[0] : row.image_assets;
  const linkType: AdLinkType = row.link_type === "internal" ? "internal" : "external";
  const openMode: AdOpenMode = row.open_mode === "internal" || row.open_mode === "external_same" ? row.open_mode : "external_new";
  const position = normalizeAdPosition(row.placement) ?? "home";
  const externalUrl = row.external_url || (linkType === "external" ? row.href : null);

  return {
    id: row.id,
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
    open_mode: openMode,
    position,
    is_active: row.is_active,
    start_date: row.starts_at,
    end_date: row.ends_at,
    sort_order: row.sort_order,
    created_at: row.created_at,
  };
}
