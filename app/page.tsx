import { BookOpenCheck, BriefcaseBusiness, Building2, CarFront, Map, Newspaper, ShoppingBag, Store } from "lucide-react";
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

const newsPlaceholders = [
  {
    title: "OpenAA 首页模块视觉对齐",
    description: "新闻聚合将在后续阶段接入真实 news_posts；当前先保留首页排行卡结构。",
    href: "/news",
    meta: "01",
    tag: "平台公告",
  },
  {
    title: "纽约生活指南入口持续完善",
    description: "后续会按本地新闻、新手指南、DMV 教程、生活指南等分类展示。",
    href: "/news",
    meta: "02",
    tag: "生活指南",
  },
];

export default async function HomePage() {
  const latestPosts = await getLatestPosts(4);

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
      <LatestTicker items={[{ label: "OpenAA 首页模块显示方式正在对齐 ny.openaa.com，真实配置将在后续阶段接入。", href: "/news" }]} />
      <QuickGrid items={quickItems} />
      <UtilityCards
        items={[
          { title: "DMV 笔试练习", description: "中文题库、练习模式、模拟考试入口。", href: "/dmv", icon: "dmv", theme: "blue", cta: "练习" },
          { title: "罚单查询", description: "停车、闯红灯、超速拍照查询入口。", href: "/dmv/tickets", icon: "ticket", theme: "orange", cta: "查询" },
          { title: "常用导航", description: "政府服务、交通、生活网站入口。", href: "/navigation", icon: "navigation", theme: "cyan", cta: "打开" },
          { title: "新手指南", description: "纽约生活、证件、交通和常用信息。", href: "/news", icon: "guide", theme: "amber", cta: "查看" },
        ]}
      />
      <LatestPostsSection
        groups={[
          {
            key: "jobs",
            title: "最新招聘",
            navLabel: "招聘",
            description: "纽约华人招聘、求职、兼职和全职信息。",
            route: "/jobs",
            posts: latestPosts.data.job,
            layout: "grid",
          },
          {
            key: "housing",
            title: "最新房屋",
            navLabel: "房屋",
            description: "租房、求租、合租和房屋信息。",
            route: "/housing",
            posts: latestPosts.data.housing,
            layout: "grid",
          },
          {
            key: "marketplace",
            title: "最新二手",
            navLabel: "二手",
            description: "出售、求购和跳蚤市场信息。",
            route: "/marketplace",
            posts: latestPosts.data.marketplace,
            layout: "grid",
          },
          {
            key: "services",
            title: "本地服务",
            navLabel: "服务",
            description: "搬家、维修、装修、报税等服务。",
            route: "/services",
            posts: latestPosts.data.service,
            layout: "media",
          },
          {
            key: "news",
            title: "最新新闻",
            navLabel: "新闻",
            description: "本地新闻、新手指南、DMV 教程和平台公告。",
            route: "/news",
            posts: newsPlaceholders,
            layout: "news",
          },
        ]}
      />
      <SeoContentCard />
    </div>
  );
}
