"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { DEFAULT_PAGE_SIZE } from "@/features/posts/filters";
import type { PublicPostFilters } from "@/features/posts/types";

type ChannelFilterBarProps = {
  filters: PublicPostFilters;
  path: string;
  placeholder: string;
  workTypeOptions?: string[];
  categoryOptions?: string[];
  areaOptions?: string[];
};

const defaultAreaOptions = ["法拉盛", "皇后区", "布鲁克林", "曼哈顿", "布朗克斯", "史坦顿岛", "长岛", "新泽西", "其它地区"];

export function ChannelFilterBar({
  filters,
  path,
  placeholder,
  workTypeOptions = [],
  categoryOptions = [],
  areaOptions = defaultAreaOptions,
}: ChannelFilterBarProps) {
  const router = useRouter();
  const [draftQ, setDraftQ] = useState(filters.q ?? "");

  function updateUrl(next: Partial<PublicPostFilters>) {
    const merged = { ...filters, ...next, page: 1 };
    const params = new URLSearchParams();

    if (merged.mode) params.set("mode", merged.mode);
    if (merged.q?.trim()) params.set("q", merged.q.trim());
    if (merged.workType) params.set("workType", merged.workType);
    if (merged.category) params.set("category", merged.category);
    if (merged.area) params.set("area", merged.area);
    if (merged.min !== undefined) params.set("min", String(merged.min));
    if (merged.max !== undefined) params.set("max", String(merged.max));
    if (merged.sort !== "latest") params.set("sort", merged.sort);
    if (merged.pageSize !== DEFAULT_PAGE_SIZE) params.set("pageSize", String(merged.pageSize));

    const query = params.toString();
    router.push(query ? `${path}?${query}` : path);
  }

  function onSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateUrl({ q: draftQ });
  }

  return (
    <section className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
      <form onSubmit={onSearchSubmit} className="flex flex-col gap-2 md:flex-row md:items-center">
        <label className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-500 md:min-w-72 md:flex-1">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            value={draftQ}
            onChange={(event) => setDraftQ(event.target.value)}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
          />
        </label>

        {workTypeOptions.length > 0 ? (
          <select
            value={filters.workType ?? ""}
            onChange={(event) => updateUrl({ workType: event.target.value || undefined })}
            className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-base font-semibold text-slate-800 outline-none focus:border-blue-500 md:w-36"
          >
            <option value="">工作类型</option>
            {workTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : null}

        {categoryOptions.length > 0 ? (
          <select
            value={filters.category ?? ""}
            onChange={(event) => updateUrl({ category: event.target.value || undefined })}
            className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-base font-semibold text-slate-800 outline-none focus:border-blue-500 md:w-48"
          >
            <option value="">{categoryOptions[0] ?? "全部分类"}</option>
            {categoryOptions.slice(1).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : null}

        <select
          value={filters.area ?? ""}
          onChange={(event) => updateUrl({ area: event.target.value || undefined })}
          className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-base font-semibold text-slate-800 outline-none focus:border-blue-500 md:w-40"
        >
          <option value="">全部地区</option>
          {areaOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </form>
    </section>
  );
}
