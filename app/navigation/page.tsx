import { ChannelPageChrome } from "@/components/channels/ChannelPageChrome";
import { NavigationMyCard } from "@/components/navigation/NavigationMyCard";
import { NavigationPublicSections } from "@/components/navigation/NavigationPublicSections";
import { ChannelSeoCard } from "@/components/posts/ChannelSeoCard";
import { getNavigationPageData } from "@/features/navigation/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "美国华人常用网站导航",
  description: "OpenAA 整理美国华人常用网站、政府服务、银行金融、购物平台、通讯网络、AI 工具和生活服务入口。",
  path: "/navigation",
});

type NavigationPageProps = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function NavigationPage({ searchParams }: NavigationPageProps) {
  const params = await searchParams;
  const q = params?.q?.trim() || "";
  const data = await getNavigationPageData({ q });

  return (
    <ChannelPageChrome
      channelKey="navigation"
      path="/navigation"
      title="美国华人常用网站导航"
      description="政府办事、银行金融、购物通讯、AI 工具、视频社交和生活服务常用入口。"
    >
      <NavigationMyCard />

      {data.state !== "ready" ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          {data.state === "missing_config" ? "Supabase 环境变量未配置，当前仅显示默认分类和空状态。" : `导航读取暂时不可用：${data.error ?? "请稍后再试。"}`}
        </div>
      ) : null}

      <NavigationPublicSections categories={data.categories} links={data.links} />

      <ChannelSeoCard title="纽约华人生活导航">
        OpenAA 导航页整理纽约华人常用网站、政府办事、交通出行、DMV / 驾照、生活服务和华人社区入口。公开页面只读取后台启用的导航分类和链接，不显示占位假数据。
      </ChannelSeoCard>
    </ChannelPageChrome>
  );
}
