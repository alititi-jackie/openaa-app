import { LatestTicker } from "@/components/home/LatestTicker";
import type { ChannelTickerItem } from "@/features/channels/types";
import type { HomeTickerSettings } from "@/features/home/types";

export function ChannelTicker({ items, settings }: { items: ChannelTickerItem[]; settings?: HomeTickerSettings }) {
  return <LatestTicker items={items} intervalSeconds={settings?.global.intervalSeconds} enabled={settings?.global.isEnabled} />;
}
