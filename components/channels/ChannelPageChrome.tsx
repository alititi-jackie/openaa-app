import type { ReactNode } from "react";
import { getChannelBanners, getChannelTickerConfig } from "@/features/channels/queries";
import { getAdPlaceholderSetting } from "@/features/ads/placeholders";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import type { ChannelKey } from "@/features/channels/types";
import { ChannelSectionShell } from "./ChannelSectionShell";
import { ChannelTicker } from "./ChannelTicker";
import { ChannelTopActions } from "./ChannelTopActions";
import { ChannelTopBanner } from "./ChannelTopBanner";

type ChannelPageChromeProps = {
  channelKey: ChannelKey;
  path: string;
  title: string;
  description?: string;
  topActionFavorite?: ReactNode;
  topActionButtonClassName?: string;
  children: ReactNode;
};

export async function ChannelPageChrome({ channelKey, path, title, description, topActionFavorite, topActionButtonClassName, children }: ChannelPageChromeProps) {
  const supabase = createSupabasePublicClient();
  const [banners, tickerConfig, adPlaceholder] = await Promise.all([
    getChannelBanners(channelKey),
    getChannelTickerConfig(),
    getAdPlaceholderSetting(supabase),
  ]);

  return (
    <div className="space-y-4">
      <ChannelTopBanner banners={banners} fallbackImageUrl={adPlaceholder.imageUrl} />
      <ChannelTicker items={tickerConfig.items} settings={tickerConfig.settings} />
      <ChannelTopActions path={path} title={title} text={description} favoriteAction={topActionFavorite} actionButtonClassName={topActionButtonClassName} />
      <ChannelSectionShell>{children}</ChannelSectionShell>
    </div>
  );
}
