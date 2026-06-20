import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { HomeBannerItem } from "@/components/home/HomeBanner";
import { getLatestTickerItems, getLatestTickerSettings } from "@/features/home/queries";
import { mapBanner } from "@/features/home/mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ChannelKey, ChannelTickerItem } from "./types";

type ChannelSupabaseClient = SupabaseClient;

const channelBannerPlacements: Record<ChannelKey, string> = {
  jobs: "jobs",
  housing: "housing",
  marketplace: "secondhand",
  services: "services",
  news: "news",
  navigation: "navigation",
  dmv: "dmv",
};

export async function getChannelBanners(channelKey: ChannelKey): Promise<HomeBannerItem[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("ads")
      .select("id,title,href,open_mode,placement,metadata,is_active,sort_order,starts_at,ends_at,link_type,external_url,slug,image_assets(public_url,external_url)")
      .eq("placement", channelBannerPlacements[channelKey])
      .is("deleted_at", null)
      .eq("is_active", true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      warnChannelChrome("ads", error.message);
      return [];
    }

    return (data ?? []).map((row) => mapBanner(row as Record<string, unknown>)).filter((item): item is HomeBannerItem => Boolean(item));
  } catch (error) {
    warnChannelChrome("ads", error);
    return [];
  }
}

export async function getChannelTickerItems(client?: ChannelSupabaseClient | null): Promise<ChannelTickerItem[]> {
  return getLatestTickerItems(client);
}

export async function getChannelTickerConfig(client?: ChannelSupabaseClient | null) {
  const settings = await getLatestTickerSettings(client);
  const items = await getLatestTickerItems(client, undefined, settings);
  return { items, settings };
}

function warnChannelChrome(source: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[channel-chrome] ${source} hidden`, error);
  }
}
