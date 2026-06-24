import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export const AD_PLACEHOLDER_SETTING_KEY = "default_ad_placeholder_image";

export type AdPlaceholderSetting = {
  imageUrl: string | null;
  imageAssetId: string | null;
  updatedAt: string | null;
};

type SiteSettingRow = {
  value: unknown;
  updated_at?: string | null;
};

export async function getAdPlaceholderSetting(supabase: SupabaseClient | null | undefined): Promise<AdPlaceholderSetting> {
  if (!supabase) return emptyAdPlaceholderSetting();

  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value,updated_at")
      .eq("key", AD_PLACEHOLDER_SETTING_KEY)
      .maybeSingle();

    if (error || !data) return emptyAdPlaceholderSetting();
    return normalizeAdPlaceholderSetting(data as SiteSettingRow);
  } catch {
    return emptyAdPlaceholderSetting();
  }
}

export function normalizeAdPlaceholderSetting(row: SiteSettingRow | null | undefined): AdPlaceholderSetting {
  const value = row && typeof row.value === "object" && !Array.isArray(row.value) ? (row.value as Record<string, unknown>) : {};
  const imageUrl = readNonEmptyString(value.url) ?? readNonEmptyString(value.imageUrl) ?? readNonEmptyString(value.image_url);
  const imageAssetId = readNonEmptyString(value.imageAssetId) ?? readNonEmptyString(value.image_asset_id);

  return {
    imageUrl,
    imageAssetId,
    updatedAt: row?.updated_at ?? null,
  };
}

export function emptyAdPlaceholderSetting(): AdPlaceholderSetting {
  return {
    imageUrl: null,
    imageAssetId: null,
    updatedAt: null,
  };
}

function readNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
