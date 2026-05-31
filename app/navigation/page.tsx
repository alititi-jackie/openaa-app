import Link from "next/link";
import { Map, Search, Star } from "lucide-react";
import { ChannelHero } from "@/components/posts/ChannelHero";
import { ChannelSeoCard } from "@/components/posts/ChannelSeoCard";
import { NavigationCard } from "@/components/navigation/NavigationCard";
import { NavigationCategoryTabs } from "@/components/navigation/NavigationCategoryTabs";
import { NavigationGrid } from "@/components/navigation/NavigationGrid";
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

  return (
    <div className="space-y-4">
      <ChannelHero title="纽约华人常用导航" description="常用网站、本地服务入口、政府办事、DMV、交通出行和生活资源从后台配置读取。" icon={Map} />

      <NavigationCategoryTabs categories={data.categories} activeSlug={activeCategory} q={q} />

      <form action="/navigation" className="grid gap-2 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
        {activeCategory ? <input type="hidden" name="category" value={activeCategory} /> : null}
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
          <input
            name="q"
            defaultValue={q}
            placeholder="搜索导航"
            className="min-h-11 w-full rounded-xl border border-slate-200 py-2 pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500"
          />
        </label>
        <button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
          搜索
        </button>
      </form>

      <Link href="/navigation/my" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
        <Star size={18} aria-hidden="true" />
        我的导航
      </Link>

      {data.state !== "ready" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          {data.state === "missing_config" ? "Supabase 环境变量未配置，当前显示默认分类和空导航状态。" : `导航读取暂时不可用：${data.error ?? "请稍后再试。"}`}
        </div>
      ) : null}

      {data.featuredLinks.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-950">推荐导航</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.featuredLinks.map((link) => (
              <NavigationCard key={link.id} link={link} compact />
            ))}
          </div>
        </section>
      ) : null}

      <NavigationGrid links={data.links} emptyTitle={q ? "没有匹配的导航链接" : "暂时没有公开导航链接"} />

      <ChannelSeoCard title="纽约华人生活导航">
        OpenAA 导航页整理纽约华人常用网站、政府办事、交通出行、DMV / 驾照、生活服务和华人社区入口。公开页面只读取后台启用的导航分类和链接，不显示占位假数据。
      </ChannelSeoCard>
    </div>
  );
}
