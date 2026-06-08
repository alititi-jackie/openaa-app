import { HorizontalPillTabs } from "@/components/common/HorizontalPillTabs";
import type { NavigationCategory } from "@/features/navigation/types";

function shortName(category: NavigationCategory) {
  return category.name.replace("服务", "").replace("平台", "");
}

export function NavigationCategoryTabs({
  categories,
  activeSlug,
  q,
}: {
  categories: NavigationCategory[];
  activeSlug?: string;
  q?: string;
}) {
  const tabs = [{ slug: "", name: "全部" }, ...categories.map((category) => ({ slug: category.slug, name: shortName(category) }))];
  const pillTabs = tabs.map((tab) => {
    const params = new URLSearchParams();
    if (tab.slug) params.set("category", tab.slug);
    if (q) params.set("q", q);
    return {
      value: tab.slug || "all",
      label: tab.name,
      href: params.toString() ? `/navigation?${params.toString()}` : "/navigation",
    };
  });

  return (
    <nav aria-label="导航分类" className="sticky top-14 z-20 -mx-4 border-y border-slate-100 bg-white/95 px-4 py-2 backdrop-blur">
      <HorizontalPillTabs tabs={pillTabs} activeValue={activeSlug || "all"} ariaLabel="导航分类" />
    </nav>
  );
}
