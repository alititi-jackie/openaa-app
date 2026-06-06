import { Map } from "lucide-react";
import { ChannelPageChrome } from "@/components/channels/ChannelPageChrome";
import { NavigationCategorySections } from "@/components/navigation/NavigationCategorySection";
import { NavigationCategoryTabs } from "@/components/navigation/NavigationCategoryTabs";
import { NavigationFeaturedSection } from "@/components/navigation/NavigationFeaturedSection";
import { NavigationModeSwitch } from "@/components/navigation/NavigationModeSwitch";
import { NavigationSearchBox } from "@/components/navigation/NavigationSearchBox";
import { ChannelHero } from "@/components/posts/ChannelHero";
import { ChannelSeoCard } from "@/components/posts/ChannelSeoCard";
import { getNavigationPageData } from "@/features/navigation/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "纽约华人常用导航",
  description: "OpenAA 纽约华人常用网站、政府办事、DMV、交通出行和生活服务导航。",
  path: "/navigation",
});

type NavigationPageProps = {
  searchParams?: Promise<{ category?: string; q?: string }>;
};

export default async function NavigationPage({ searchParams }: NavigationPageProps) {
  const params = await searchParams;
  const activeCategory = params?.category;
  const q = params?.q?.trim() || "";
  const data = await getNavigationPageData({ categorySlug: activeCategory, q });
  const featuredLinks = activeCategory || q ? data.links.filter((link) => link.isFeatured) : data.featuredLinks;

  return (
    <ChannelPageChrome
      channelKey="navigation"
      path="/navigation"
      title="纽约华人常用导航"
      description="OpenAA 纽约华人常用网站、政府办事、DMV、交通出行和生活服务导航。"
    >
      <ChannelHero title="纽约华人常用导航" description="把政府办事、银行金融、购物通讯、AI 工具和本地生活入口整理成清晰的常用网站清单。" icon={Map} />

      <NavigationModeSwitch active="public" />
      <NavigationCategoryTabs categories={data.categories} activeSlug={activeCategory} q={q} />
      <NavigationSearchBox activeCategory={activeCategory} q={q} />

      {data.state !== "ready" ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          {data.state === "missing_config" ? "Supabase 环境变量未配置，当前仅显示默认分类和轻量空状态。" : `导航读取暂时不可用：${data.error ?? "请稍后再试。"}`}
        </div>
      ) : null}

      <NavigationFeaturedSection links={featuredLinks} />
      <NavigationCategorySections categories={data.categories} links={data.links} q={q} />

      <ChannelSeoCard title="纽约华人生活导航">
        OpenAA 导航页整理纽约华人常用网站、政府办事、交通出行、DMV / 驾照、生活服务和华人社区入口。公开页面只读取后台启用的导航分类和链接，不显示占位假数据。
      </ChannelSeoCard>
    </ChannelPageChrome>
  );
}
