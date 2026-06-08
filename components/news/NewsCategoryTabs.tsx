import { HorizontalPillTabs } from "@/components/common/HorizontalPillTabs";
import { NEWS_CATEGORY_ALL } from "@/features/news/constants";
import type { NewsCategory } from "@/features/news/types";

export function NewsCategoryTabs({ categories, activeSlug }: { categories: NewsCategory[]; activeSlug?: string }) {
  const tabs = [{ slug: NEWS_CATEGORY_ALL, name: "全部" }, ...categories.map((category) => ({ slug: category.slug, name: category.name }))];
  const active = activeSlug || NEWS_CATEGORY_ALL;
  const pillTabs = tabs.map((tab) => ({
    value: tab.slug === NEWS_CATEGORY_ALL ? "all" : tab.slug,
    label: tab.name,
    href: tab.slug === NEWS_CATEGORY_ALL ? "/news" : `/news?category=${encodeURIComponent(tab.slug)}`,
  }));

  return <HorizontalPillTabs tabs={pillTabs} activeValue={active === NEWS_CATEGORY_ALL ? "all" : active} ariaLabel="新闻分类" className="rounded-xl border border-slate-100 bg-white p-2 shadow-sm" />;
}
