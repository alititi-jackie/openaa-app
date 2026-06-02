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
  children: ReactNode;
};

export async function ChannelPageChrome({ channelKey, path, title, description, children }: ChannelPageChromeProps) {
  const [banner, tickerConfig] = await Promise.all([
    getChannelBanner(channelKey),
    getChannelTickerConfig(),
  ]);

  return (
    <div className="space-y-4">
      <ChannelTopBanner banner={banner} />
      <ChannelTicker items={tickerConfig.items} settings={tickerConfig.settings} />
      <ChannelTopActions path={path} title={title} text={description} />
      <ChannelSectionShell>{children}</ChannelSectionShell>
    </div>
  );
}
