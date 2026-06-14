import type { ReactNode } from "react";
import { getChannelBanner, getChannelTickerConfig } from "@/features/channels/queries";
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
  const [banner, tickerConfig] = await Promise.all([
    getChannelBanner(channelKey),
    getChannelTickerConfig(),
  ]);

  return (
    <div className="space-y-4">
      <ChannelTopBanner banner={banner} />
      <ChannelTicker items={tickerConfig.items} settings={tickerConfig.settings} />
      <ChannelTopActions path={path} title={title} text={description} favoriteAction={topActionFavorite} actionButtonClassName={topActionButtonClassName} />
      <ChannelSectionShell>{children}</ChannelSectionShell>
    </div>
  );
}
