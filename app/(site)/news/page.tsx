import { Newspaper } from "lucide-react";
import { ChannelPageChrome } from "@/components/channels/ChannelPageChrome";
import { ChannelHero } from "@/components/posts/ChannelHero";
import { ChannelSeoCard } from "@/components/posts/ChannelSeoCard";
import { NewsCategoryTabs } from "@/components/news/NewsCategoryTabs";
import { NewsList } from "@/components/news/NewsList";
import { getNewsCategories, getPublishedNewsList } from "@/features/news/queries";
import { NEWS_CATEGORY_ALL, NEWS_DEFAULT_DESCRIPTION } from "@/features/news/constants";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

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
    <ChannelPageChrome
      channelKey="news"
      path="/news"
      title="新闻资讯"
      description="美国华人生活资讯、平台公告、新手指南与实用教程"
    >
      <ChannelHero
        title="新闻资讯"
        description="美国华人生活资讯、平台公告、新手指南与实用教程"
        icon={Newspaper}
      />
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
      <ChannelSeoCard title="纽约华人新闻资讯与新手生活指南">
        <div className="space-y-3">
          <p>
            OpenAA 新闻资讯频道延续旧站“中文资讯与国际新闻入口”的定位，面向纽约华人、美国华人、新移民和留学生整理本地新闻、社区动态、DMV 教程、生活指南和平台公告。很多用户第一次来到纽约时，会同时需要找房、找工作、查交通、看政策变化和了解社区信息，因此新闻频道会把这些内容集中到一个移动端友好的页面里。
          </p>
          <p>
            这个频道适合想快速了解纽约本地动态的华人家庭、准备搬家或找工作的用户、正在学习 DMV 流程的新手司机，以及需要关注平台公告和生活提醒的用户。你可以先按分类筛选新闻资讯，再进入详情页查看发布时间、封面图和正文内容；如果只想看 DMV 教程或新手生活指南，也可以通过分类快速缩小范围。
          </p>
          <p>
            OpenAA 新闻频道不追求堆砌标题，而是希望把纽约华人生活中经常会用到的信息解释清楚：哪些内容适合新移民，哪些属于社区动态，哪些只是平台公告。随着新站内容增加，新闻资讯会和招聘、房屋租售、二手市场、本地服务、DMV 工具中心形成互相补充的生活信息入口，让用户在一个站内完成浏览、搜索和继续阅读。
          </p>
          <ul className="space-y-1 font-bold text-slate-700">
            <li>适合用户：纽约华人、新移民、留学生、关注本地生活资讯的美国华人用户</li>
            <li>核心内容：本地新闻、社区动态、新手生活指南、DMV 教程和平台公告</li>
            <li>使用建议：先按分类筛选，再结合发布时间和详情内容判断是否继续阅读</li>
          </ul>
        </div>
      </ChannelSeoCard>
    </ChannelPageChrome>
  );
}
