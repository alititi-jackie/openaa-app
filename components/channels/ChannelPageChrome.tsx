import type { ReactNode } from "react";
import { getChannelBanner, getChannelTickerItems } from "@/features/channels/queries";
import type { ChannelKey } from "@/features/channels/types";
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
  const [banner, tickerItems] = await Promise.all([
    getChannelBanner(channelKey),
    getChannelTickerItems(),
  ]);

  return (
    <div className="space-y-4">
      <ChannelTopBanner banner={banner} />
      <ChannelTicker items={tickerItems} />
      <ChannelTopActions path={path} title={title} text={description} />
      {children}
    </div>
  );
}
