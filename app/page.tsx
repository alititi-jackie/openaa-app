import { BookOpenCheck, BriefcaseBusiness, Building2, CarFront, FileQuestion, Map, Newspaper, Route, ShoppingBag, Store } from "lucide-react";
import { HomeBanner } from "@/components/home/HomeBanner";
import { LatestPostsSection } from "@/components/home/LatestPostsSection";
import { LatestTicker } from "@/components/home/LatestTicker";
import { QuickGrid } from "@/components/home/QuickGrid";
import { SeoContentCard } from "@/components/home/SeoContentCard";
import { UtilityCards } from "@/components/home/UtilityCards";
import { getLatestPosts } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "OpenAA 纽约华人生活入口",
  description: "OpenAA 纽约华人生活信息入口，包含招聘、房屋、二手市场、本地服务、新闻、DMV 和常用导航。",
  path: "/",
});

export const dynamic = "force-dynamic";

const quickItems = [
  { href: "/jobs", label: "招聘", icon: BriefcaseBusiness },
  { href: "/housing", label: "房屋", icon: Building2 },
  { href: "/marketplace", label: "二手", icon: ShoppingBag },
  { href: "/dmv", label: "DMV", icon: CarFront },
  { href: "/navigation", label: "导航", icon: Map },
  { href: "/news", label: "新闻", icon: Newspaper },
  { href: "/news", label: "新手指南", icon: BookOpenCheck },
  { href: "/services", label: "本地服务", icon: Store },
];

export default async function HomePage() {
  const latestPosts = await getLatestPosts(2);

  return (
    <div className="space-y-4">
      <HomeBanner
        item={{
          title: "纽约华人生活信息入口",
          description: "招聘、租房、二手、本地服务、DMV 学习和常用导航，先从一个清爽的移动端首页开始。",
          href: "/navigation",
          imageUrl: "/og-default.png",
        }}
      />
      <LatestTicker items={[{ label: "Phase 4：OpenAA 首页和公共频道基础壳已就绪，真实数据将在后续阶段接入。", href: "/news" }]} />
      <QuickGrid items={quickItems} />
      <UtilityCards
        items={[
          { title: "DMV 笔试练习", description: "中文题库、练习模式、模拟考试入口占位。", href: "/dmv", icon: CarFront },
          { title: "罚单查询", description: "纽约交通罚单查询入口占位，后续可扩展更多生活工具。", href: "/dmv/tickets", icon: FileQuestion },
          { title: "常用导航", description: "政府服务、交通、生活网站入口。", href: "/navigation", icon: Route },
        ]}
      />
      <LatestPostsSection
        groups={[
          {
            title: "最新招聘",
            description: "后续显示纽约华人招聘、求职、兼职和全职信息。",
            posts: latestPosts.data.job,
          },
          {
            title: "最新房屋",
            description: "后续显示租房、求租、合租和房屋信息。",
            posts: latestPosts.data.housing,
          },
          {
            title: "最新二手",
            description: "后续显示出售、求购和跳蚤市场信息。",
            posts: latestPosts.data.marketplace,
          },
          {
            title: "本地服务",
            description: "后续显示搬家、维修、装修、报税等服务。",
            posts: latestPosts.data.service,
          },
          {
            title: "最新新闻",
            description: "后续显示本地新闻、新手指南和平台公告。",
            posts: [{ title: "新闻资讯占位", description: "真实列表将在后续 Phase 接入。", href: "/news", meta: "占位", tag: "新闻" }],
          },
        ]}
      />
      <SeoContentCard />
    </div>
  );
}
