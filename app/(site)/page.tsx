import { HomeBanner } from "@/components/home/HomeBanner";
import { LatestPostsSection } from "@/components/home/LatestPostsSection";
import { LatestTicker } from "@/components/home/LatestTicker";
import { QuickGrid } from "@/components/home/QuickGrid";
import { SeoContentCard } from "@/components/home/SeoContentCard";
import { UtilityCards } from "@/components/home/UtilityCards";
import { getHomeConfig } from "@/features/home/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "OpenAA 纽约华人生活入口",
  description: "OpenAA 纽约华人生活信息入口，包含招聘、房屋、二手市场、本地服务、新闻、DMV 和常用导航。",
  path: "/",
});

export const revalidate = 300;

export default async function HomePage() {
  const homeConfig = await getHomeConfig();

  return (
    <div className="space-y-4">
      <h1 className="sr-only">OpenAA</h1>
      <HomeBanner items={homeConfig.banners} fallbackImageUrl={homeConfig.adPlaceholderImageUrl} />
      <LatestTicker items={homeConfig.tickerItems} intervalSeconds={homeConfig.tickerSettings.global.intervalSeconds} enabled={homeConfig.tickerSettings.global.isEnabled} />
      {homeConfig.quickGridVisible ? <QuickGrid items={homeConfig.quickGridItems} /> : null}
      <UtilityCards items={homeConfig.utilityTools} isVisible={homeConfig.utilityToolsVisible} />
      <LatestPostsSection groups={homeConfig.latestPostGroups} isVisible={homeConfig.latestPostsVisible} />
      <SeoContentCard title={homeConfig.seo.title} content={homeConfig.seo.content} isVisible={homeConfig.seo.isVisible} />
    </div>
  );
}
