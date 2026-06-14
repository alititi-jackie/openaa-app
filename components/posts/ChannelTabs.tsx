import { HorizontalPillTabs } from "@/components/common/HorizontalPillTabs";
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
  const pillTabs = [
    { value: "all", label: "全部", href: hrefFor(path, filters) },
    ...tabs.map((tab) => ({ value: tab.value, label: tab.label, href: hrefFor(path, filters, tab.value) })),
  ];

  return <HorizontalPillTabs tabs={pillTabs} activeValue={filters.mode || "all"} ariaLabel="频道类型" />;
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
