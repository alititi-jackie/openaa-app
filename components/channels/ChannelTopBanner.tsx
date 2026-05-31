import type { HomeBannerItem } from "@/components/home/HomeBanner";
import { HomeBanner } from "@/components/home/HomeBanner";

export function ChannelTopBanner({ banner }: { banner: HomeBannerItem | null }) {
  if (!banner) return null;

  return <HomeBanner item={banner} />;
}
