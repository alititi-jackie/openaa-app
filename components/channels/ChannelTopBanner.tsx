import type { HomeBannerItem } from "@/components/home/HomeBanner";
import { HomeBanner } from "@/components/home/HomeBanner";

export function ChannelTopBanner({ banners, fallbackImageUrl }: { banners: HomeBannerItem[]; fallbackImageUrl?: string | null }) {
  if (banners.length === 0) return null;

  return <HomeBanner items={banners} fallbackImageUrl={fallbackImageUrl} />;
}
