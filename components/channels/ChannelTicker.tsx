import { LatestTicker } from "@/components/home/LatestTicker";
import type { ChannelTickerItem } from "@/features/channels/types";

export function ChannelTicker({ items }: { items: ChannelTickerItem[] }) {
  return <LatestTicker items={items} />;
}
