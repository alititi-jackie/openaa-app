import Link from "next/link";
import { DEFAULT_PAGE_SIZE } from "@/features/posts/filters";
import type { PostOption } from "@/features/posts/options";
import type { PublicPostFilters } from "@/features/posts/types";

export type ChannelModeTab = PostOption;

export function ChannelTabs({
  tabs,
  filters,
  path,
}: {
  tabs?: readonly ChannelModeTab[];
  filters: PublicPostFilters;
  path: string;
}) {
  if (!tabs?.length) return null;

  return (
    <div className="flex max-w-full flex-wrap items-center gap-2">
      <Link href={hrefFor(path, filters)} className={tabClass(!filters.mode)}>
        全部
      </Link>
      {tabs.map((tab) => {
        const isActive = filters.mode === tab.value;

        return (
          <Link key={tab.value} href={hrefFor(path, filters, tab.value)} className={tabClass(isActive)}>
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

function tabClass(isActive: boolean) {
  return [
    "min-h-10 rounded-lg border px-4 py-2 text-center text-sm font-bold shadow-sm transition",
    isActive ? "border-blue-200 bg-white text-slate-950" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200 hover:bg-white",
  ].join(" ");
}

function hrefFor(path: string, filters: PublicPostFilters, mode?: string) {
  const params = new URLSearchParams();
  if (mode) params.set("mode", mode);
  if (filters.q) params.set("q", filters.q);
  if (filters.workType) params.set("workType", filters.workType);
  if (filters.category) params.set("category", filters.category);
  if (filters.area) params.set("area", filters.area);
  if (filters.min !== undefined) params.set("min", String(filters.min));
  if (filters.max !== undefined) params.set("max", String(filters.max));
  if (filters.sort !== "latest") params.set("sort", filters.sort);
  if (filters.pageSize !== DEFAULT_PAGE_SIZE) params.set("pageSize", String(filters.pageSize));
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
