import type { HomeBannerItem } from "@/components/home/HomeBanner";
import { HomeBanner } from "@/components/home/HomeBanner";

export function ChannelTopBanner({ banners }: { banners: HomeBannerItem[] }) {
  if (banners.length === 0) return null;

  return <HomeBanner items={banners} />;
}
