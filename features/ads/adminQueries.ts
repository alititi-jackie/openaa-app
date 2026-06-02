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
  image_source_type: "storage" | "external" | null;
  is_active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  computed_status: "active" | "inactive" | "scheduled" | "expired";
};

export type AdminAdsResult = {
  state: QueryState;
  canManageAds: boolean;
  ads: AdminAdRow[];
  error?: string;
};

type RawAdRow = Omit<AdminAdRow, "image_url" | "image_source_type" | "computed_status"> & {
  image_assets?: { source_type: "storage" | "external" | null; public_url: string | null; external_url: string | null } | Array<{ source_type: "storage" | "external" | null; public_url: string | null; external_url: string | null }> | null;
};

export async function getAdminAdsData(placement?: string, status?: string): Promise<AdminAdsResult> {
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
    .select("id,placement,title,href,open_mode,image_asset_id,is_active,sort_order,starts_at,ends_at,image_assets(source_type,public_url,external_url)")
    .order("placement", { ascending: true })
    .order("sort_order", { ascending: true });

  if (placement && placement !== "all") {
    query = query.eq("placement", placement);
  }

  const { data, error } = await query;
  if (error) {
    return { state: "error", canManageAds, ads: [], error: "广告读取失败，请稍后再试。" };
  }

  const ads = ((data ?? []) as RawAdRow[]).map(mapAd);
  const filteredAds = status && status !== "all" ? ads.filter((ad) => ad.computed_status === status) : ads;

  return { state: "ready", canManageAds, ads: filteredAds };
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
    image_source_type: imageAsset?.source_type ?? null,
    is_active: row.is_active,
    sort_order: row.sort_order,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    computed_status: getComputedStatus(row),
  };
}

function getComputedStatus(row: RawAdRow): AdminAdRow["computed_status"] {
  if (!row.is_active) return "inactive";
  const now = Date.now();
  const startsAt = row.starts_at ? new Date(row.starts_at).getTime() : null;
  const endsAt = row.ends_at ? new Date(row.ends_at).getTime() : null;

  if (startsAt && startsAt > now) return "scheduled";
  if (endsAt && endsAt < now) return "expired";
  return "active";
}
