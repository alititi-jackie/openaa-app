"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, SORT_LABELS } from "@/features/posts/filters";
import type { PostSort, PublicPostFilters } from "@/features/posts/types";

type ChannelFilterBarProps = {
  filters: PublicPostFilters;
  path: string;
  placeholder: string;
  tabs: string[];
  priceFilterLabel?: string;
  showPriceFilters?: boolean;
  showPriceSort?: boolean;
};

export function ChannelFilterBar({
  filters,
  path,
  placeholder,
  tabs,
  priceFilterLabel = "价格/薪资",
  showPriceFilters = true,
  showPriceSort = true,
}: ChannelFilterBarProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(() => ({
    category: filters.category ?? "",
    q: filters.q ?? "",
    area: filters.area ?? "",
    min: filters.min?.toString() ?? "",
    max: filters.max?.toString() ?? "",
    sort: filters.sort,
    pageSize: filters.pageSize.toString(),
  }));
  const sortLabel = SORT_LABELS[filters.sort] ?? SORT_LABELS.latest;
  const sortOptions = useMemo(() => (showPriceSort ? Object.entries(SORT_LABELS) : Object.entries(SORT_LABELS).filter(([value]) => value === "latest" || value === "oldest")), [showPriceSort]);

  function updateUrl(next: typeof draft) {
    const params = new URLSearchParams();
    if (next.category) params.set("category", next.category);
    if (next.q.trim()) params.set("q", next.q.trim());
    if (next.area.trim()) params.set("area", next.area.trim());
    if (showPriceFilters && next.min.trim()) params.set("min", next.min.trim());
    if (showPriceFilters && next.max.trim()) params.set("max", next.max.trim());
    if (next.sort !== "latest") params.set("sort", next.sort);
    if (next.pageSize !== String(DEFAULT_PAGE_SIZE)) params.set("pageSize", next.pageSize);
    const query = params.toString();
    router.push(query ? `${path}?${query}` : path);
  }

  function onSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateUrl({ ...draft, q: draft.q });
  }

  function onConfirm() {
    updateUrl(draft);
    setIsOpen(false);
  }

  function onClear() {
    const cleared = { category: "", q: "", area: "", min: "", max: "", sort: "latest" as PostSort, pageSize: String(DEFAULT_PAGE_SIZE) };
    setDraft(cleared);
    router.push(path);
    setIsOpen(false);
  }

  return (
    <section className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
      <form onSubmit={onSearchSubmit}>
        <label className="flex min-h-11 items-center gap-2 rounded-lg bg-slate-50 px-3 text-sm text-slate-500">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            value={draft.q}
            onChange={(event) => setDraft((current) => ({ ...current, q: event.target.value }))}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
          />
        </label>
      </form>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => setIsOpen(true)} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
          <SlidersHorizontal size={16} aria-hidden="true" />
          筛选
        </button>
        <button type="button" onClick={() => setIsOpen(true)} className="min-h-10 flex-1 rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
          {sortLabel}
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/35 px-3 pb-3 pt-12 sm:items-center sm:justify-center">
          <div className="w-full rounded-2xl bg-white p-4 shadow-xl sm:max-w-md">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-black text-slate-950">筛选</h2>
              <button type="button" onClick={() => setIsOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600">
                <X size={17} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-black text-slate-500">分类</span>
                <select value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none">
                  {tabs.map((tab) => (
                    <option key={tab} value={tab === "全部" ? "" : tab}>
                      {tab}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-black text-slate-500">地区/区域</span>
                <input value={draft.area} onChange={(event) => setDraft((current) => ({ ...current, area: event.target.value }))} className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none" placeholder="输入地区或区域" />
              </label>

              {showPriceFilters ? (
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-xs font-black text-slate-500">最低{priceFilterLabel}</span>
                    <input type="number" min="0" value={draft.min} onChange={(event) => setDraft((current) => ({ ...current, min: event.target.value }))} className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-black text-slate-500">最高{priceFilterLabel}</span>
                    <input type="number" min="0" value={draft.max} onChange={(event) => setDraft((current) => ({ ...current, max: event.target.value }))} className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none" />
                  </label>
                </div>
              ) : null}

              <label className="block">
                <span className="text-xs font-black text-slate-500">排序</span>
                <select value={draft.sort} onChange={(event) => setDraft((current) => ({ ...current, sort: event.target.value as PostSort }))} className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none">
                  {sortOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-black text-slate-500">每页显示</span>
                <select value={draft.pageSize} onChange={(event) => setDraft((current) => ({ ...current, pageSize: event.target.value }))} className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none">
                  {PAGE_SIZE_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value} 条
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={onClear} className="min-h-11 rounded-lg bg-slate-100 text-sm font-black text-slate-700">
                清空筛选
              </button>
              <button type="button" onClick={onConfirm} className="min-h-11 rounded-lg bg-slate-950 text-sm font-black text-white">
                确认
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
