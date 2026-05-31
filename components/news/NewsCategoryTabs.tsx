import Link from "next/link";
import { NEWS_CATEGORY_ALL } from "@/features/news/constants";
import type { NewsCategory } from "@/features/news/types";

export function NewsCategoryTabs({ categories, activeSlug }: { categories: NewsCategory[]; activeSlug?: string }) {
  const tabs = [{ slug: NEWS_CATEGORY_ALL, name: "全部" }, ...categories.map((category) => ({ slug: category.slug, name: category.name }))];
  const active = activeSlug || NEWS_CATEGORY_ALL;

  return (
    <nav className="flex gap-2 overflow-x-auto rounded-xl border border-slate-100 bg-white p-2 shadow-sm" aria-label="新闻分类">
      {tabs.map((tab) => {
        const isActive = tab.slug === active;
        const href = tab.slug === NEWS_CATEGORY_ALL ? "/news" : `/news?category=${encodeURIComponent(tab.slug)}`;

        return (
          <Link
            key={tab.slug}
            href={href}
            className={
              isActive
                ? "shrink-0 rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white"
                : "shrink-0 rounded-lg bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700"
            }
          >
            {tab.name}
          </Link>
        );
      })}
    </nav>
  );
}
