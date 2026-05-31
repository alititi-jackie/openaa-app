import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { NavigationCategory } from "@/features/navigation/types";

export function NavigationCategoryTabs({
  categories,
  activeSlug,
  q,
}: {
  categories: NavigationCategory[];
  activeSlug?: string;
  q?: string;
}) {
  const tabs = [{ slug: "", name: "全部" }, ...categories.map((category) => ({ slug: category.slug, name: category.name }))];

  return (
    <nav aria-label="导航分类" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
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
              "inline-flex min-h-10 shrink-0 items-center rounded-xl border px-4 text-sm font-black",
              active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700",
            )}
          >
            {tab.name}
          </Link>
        );
      })}
    </nav>
  );
}
