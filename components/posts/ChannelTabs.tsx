import Link from "next/link";
import { DEFAULT_PAGE_SIZE } from "@/features/posts/filters";
import type { PublicPostFilters } from "@/features/posts/types";

export function ChannelTabs({ tabs, filters, path }: { tabs: string[]; filters: PublicPostFilters; path: string }) {
  return (
    <div className="flex gap-2 overflow-x-auto rounded-xl border border-slate-100 bg-white p-2 shadow-sm">
      {tabs.map((tab, index) => (
        <Link
          key={tab}
          href={hrefFor(path, filters, tab)}
          className={
            (index === 0 && !filters.category) || filters.category === tab
              ? "shrink-0 rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white"
              : "shrink-0 rounded-lg bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700"
          }
        >
          {tab}
        </Link>
      ))}
    </div>
  );
}

function hrefFor(path: string, filters: PublicPostFilters, tab: string) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.area) params.set("area", filters.area);
  if (filters.min !== undefined) params.set("min", String(filters.min));
  if (filters.max !== undefined) params.set("max", String(filters.max));
  if (filters.sort !== "latest") params.set("sort", filters.sort);
  if (filters.pageSize !== DEFAULT_PAGE_SIZE) params.set("pageSize", String(filters.pageSize));
  if (tab !== "全部") params.set("category", tab);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
