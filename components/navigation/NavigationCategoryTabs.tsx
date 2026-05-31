import Link from "next/link";
import { cn } from "@/lib/utils/cn";
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

  return (
    <nav aria-label="导航分类" className="sticky top-14 z-20 -mx-4 border-y border-slate-100 bg-white/95 px-4 py-2 backdrop-blur">
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const active = (activeSlug ?? "") === tab.slug;
          const params = new URLSearchParams();
          if (tab.slug) params.set("category", tab.slug);
          if (q) params.set("q", q);
          const href = params.toString() ? `/navigation?${params.toString()}` : "/navigation";

          return (
            <Link
              key={tab.slug || "all"}
              href={href}
              className={cn(
                "inline-flex min-h-9 shrink-0 items-center rounded-full border px-4 text-sm font-black shadow-sm transition",
                active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700",
              )}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
