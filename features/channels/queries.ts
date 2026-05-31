import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { HomeBannerItem } from "@/components/home/HomeBanner";
import { getLatestTickerItems } from "@/features/home/queries";
import { mapBanner } from "@/features/home/mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ChannelKey, ChannelTickerItem } from "./types";

type ChannelSupabaseClient = SupabaseClient;

const channelBannerPlacements: Record<ChannelKey, string> = {
  jobs: "jobs_top",
  housing: "housing_top",
  marketplace: "marketplace_top",
  services: "services_top",
  news: "news_top",
  navigation: "navigation_top",
  dmv: "dmv_top",
};

export async function getChannelBanner(channelKey: ChannelKey): Promise<HomeBannerItem | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("ads")
      .select("id,title,href,open_mode,placement,metadata,is_active,sort_order,starts_at,ends_at,image_assets(public_url,external_url)")
      .eq("placement", channelBannerPlacements[channelKey])
      .eq("is_active", true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order("sort_order", { ascending: true })
      .limit(1);

    if (error) {
      warnChannelChrome("ads", error.message);
      return null;
    }

    return (data ?? []).map((row) => mapBanner(row as Record<string, unknown>)).find(Boolean) ?? null;
  } catch (error) {
    warnChannelChrome("ads", error);
    return null;
  }
}

export async function getChannelTickerItems(client?: ChannelSupabaseClient | null): Promise<ChannelTickerItem[]> {
  return getLatestTickerItems(client);
}

function warnChannelChrome(source: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[channel-chrome] ${source} hidden`, error);
  }
}
