import "server-only";

import { hasAdminPermission } from "@/lib/permissions/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { QueryState } from "@/features/posts/types";

export type AdminAdRow = {
  id: string;
  placement: string;
  title: string;
  href: string | null;
  open_mode: "same" | "new";
  image_asset_id: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
};

export type AdminAdsResult = {
  state: QueryState;
  canManageAds: boolean;
  ads: AdminAdRow[];
  error?: string;
};

type RawAdRow = Omit<AdminAdRow, "image_url"> & {
  image_assets?: { public_url: string | null; external_url: string | null } | Array<{ public_url: string | null; external_url: string | null }> | null;
};

export async function getAdminAdsData(placement?: string): Promise<AdminAdsResult> {
  const supabase = await createSupabaseServerClient();
  const canManageAds = await hasAdminPermission("manage_ads");

  if (!supabase) {
    return { state: "missing_config", canManageAds, ads: [] };
  }

  if (!canManageAds) {
    return { state: "ready", canManageAds, ads: [] };
  }

  let query = supabase
    .from("ads")
    .select("id,placement,title,href,open_mode,image_asset_id,is_active,sort_order,starts_at,ends_at,image_assets(public_url,external_url)")
    .order("placement", { ascending: true })
    .order("sort_order", { ascending: true });

  if (placement && placement !== "all") {
    query = query.eq("placement", placement);
  }

  const { data, error } = await query;
  if (error) {
    return { state: "error", canManageAds, ads: [], error: "广告读取失败，请稍后再试。" };
  }

  return { state: "ready", canManageAds, ads: ((data ?? []) as RawAdRow[]).map(mapAd) };
}

function mapAd(row: RawAdRow): AdminAdRow {
  const imageAsset = Array.isArray(row.image_assets) ? row.image_assets[0] : row.image_assets;
  return {
    id: row.id,
    placement: row.placement,
    title: row.title,
    href: row.href,
    open_mode: row.open_mode === "new" ? "new" : "same",
    image_asset_id: row.image_asset_id,
    image_url: imageAsset?.public_url || imageAsset?.external_url || null,
    is_active: row.is_active,
    sort_order: row.sort_order,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
  };
}
