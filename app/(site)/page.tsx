import { HomeBanner } from "@/components/home/HomeBanner";
import { LatestPostsSection } from "@/components/home/LatestPostsSection";
import { LatestTicker } from "@/components/home/LatestTicker";
import { QuickGrid } from "@/components/home/QuickGrid";
import { SeoContentCard } from "@/components/home/SeoContentCard";
import { UtilityCards } from "@/components/home/UtilityCards";
import { getHomeConfig } from "@/features/home/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { isSupabaseServerConfigured } from "@/lib/supabase/server";

export const metadata = {
  ...buildPageMetadata({
    title: "OpenAA 美国华人生活平台",
    description:
      "OpenAA 美国华人生活平台，提供华人招聘、租房、二手交易、本地服务、DMV 中文驾考、新闻资讯、实用工具和网站导航。目前重点服务纽约及周边地区，致力于为全美华人提供便捷的中文生活信息服务。",
    path: "/",
  }),
  title: { absolute: "OpenAA 美国华人生活平台" },
};

export const revalidate = 300;

export default async function HomePage() {
  if (process.env.NEXT_PHASE === "phase-production-build" && !isSupabaseServerConfigured()) {
    throw new Error("Supabase public environment variables are required to prerender the home page.");
  }

  const homeConfig = await getHomeConfig();

  return (
    <div className="space-y-4">
      <h1 className="sr-only">OpenAA</h1>
      <HomeBanner items={homeConfig.banners} fallbackImageUrl={homeConfig.adPlaceholderImageUrl} />
      <LatestTicker items={homeConfig.tickerItems} intervalSeconds={homeConfig.tickerSettings.global.intervalSeconds} enabled={homeConfig.tickerSettings.global.isEnabled} />
      {homeConfig.quickGridVisible ? <QuickGrid items={homeConfig.quickGridItems} /> : null}
      <UtilityCards items={homeConfig.utilityTools} isVisible={homeConfig.utilityToolsVisible} />
      <LatestPostsSection groups={homeConfig.latestPostGroups} title={homeConfig.latestPostsTitle} isVisible={homeConfig.latestPostsVisible} />
      <SeoContentCard title={homeConfig.seo.title} content={homeConfig.seo.content} isVisible={homeConfig.seo.isVisible} />
    </div>
  );
}
