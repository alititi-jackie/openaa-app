import Link from "next/link";
import { DEFAULT_PAGE_SIZE } from "@/features/posts/filters";
import type { PublicPostFilters } from "@/features/posts/types";

export type ChannelModeTab = {
  label: string;
  value: string;
};

export function ChannelTabs({
  tabs,
  filters,
  path,
}: {
  tabs?: ChannelModeTab[];
  filters: PublicPostFilters;
  path: string;
}) {
  if (!tabs?.length) return null;

  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-white p-2 shadow-sm">
      {tabs.map((tab) => {
        const isActive = filters.mode === tab.value;

        return (
          <Link
            key={tab.value}
            href={hrefFor(path, filters, isActive ? undefined : tab.value)}
            className={
              isActive
                ? "min-h-10 rounded-lg bg-slate-950 px-3 py-2 text-center text-sm font-bold text-white"
                : "min-h-10 rounded-lg bg-slate-50 px-3 py-2 text-center text-sm font-bold text-slate-700"
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
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
