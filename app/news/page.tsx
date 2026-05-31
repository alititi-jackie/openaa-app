import { Newspaper } from "lucide-react";
import { ChannelHero } from "@/components/posts/ChannelHero";
import { ChannelSeoCard } from "@/components/posts/ChannelSeoCard";
import { NewsCategoryTabs } from "@/components/news/NewsCategoryTabs";
import { NewsList } from "@/components/news/NewsList";
import { getNewsCategories, getPublishedNewsList } from "@/features/news/queries";
import { NEWS_CATEGORY_ALL, NEWS_DEFAULT_DESCRIPTION } from "@/features/news/constants";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "纽约华人新闻",
  description: NEWS_DEFAULT_DESCRIPTION,
  path: "/news",
});

export default async function NewsPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawCategory = Array.isArray(params?.category) ? params?.category[0] : params?.category;
  const activeCategory = rawCategory && rawCategory !== NEWS_CATEGORY_ALL ? rawCategory : undefined;
  const [categoriesResult, postsResult] = await Promise.all([
    getNewsCategories(),
    getPublishedNewsList({ categorySlug: activeCategory }),
  ]);

  return (
    <div className="space-y-4">
      <ChannelHero title="纽约华人新闻" description={NEWS_DEFAULT_DESCRIPTION} icon={Newspaper} />
      <NewsCategoryTabs categories={categoriesResult.data} activeSlug={activeCategory} />
      {postsResult.state === "error" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          新闻读取暂时不可用：{postsResult.error ?? "请稍后再试。"}
        </div>
      ) : postsResult.state === "missing_config" ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          Supabase 环境变量尚未配置，当前显示空列表；配置新 Supabase 后会读取公开新闻。
        </div>
      ) : null}
      <NewsList posts={postsResult.data} />
      <ChannelSeoCard title="纽约华人新闻与生活指南">
        OpenAA 新闻频道整理纽约本地新闻、新手指南、DMV 教程、生活指南和平台公告。新闻详情页只展示已发布内容，并保留分类、发布时间、封面图和 SEO 信息，方便用户在移动端快速阅读。
      </ChannelSeoCard>
    </div>
  );
}
