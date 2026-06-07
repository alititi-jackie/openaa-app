import Link from "next/link";
import { DEFAULT_PAGE_SIZE } from "@/features/posts/filters";
import type { PublicPostFilters, PostsPagination } from "@/features/posts/types";

export function ChannelPagination({ filters, pagination, path }: { filters: PublicPostFilters; pagination: PostsPagination; path: string }) {
  if (pagination.total === 0 || pagination.pageCount <= 1) return null;

  return (
    <nav className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3 text-sm font-bold text-slate-600 shadow-sm">
      {pagination.hasPrevious ? (
        <Link href={hrefFor(path, filters, pagination.page - 1)} className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700">
          上一页
        </Link>
      ) : (
        <span className="rounded-lg bg-slate-50 px-3 py-2 text-slate-300">上一页</span>
      )}
      <span>
        第 {pagination.page} / {pagination.pageCount} 页 · 共 {pagination.total} 条
      </span>
      {pagination.hasNext ? (
        <Link href={hrefFor(path, filters, pagination.page + 1)} className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700">
          下一页
        </Link>
      ) : (
        <span className="rounded-lg bg-slate-50 px-3 py-2 text-slate-300">下一页</span>
      )}
    </nav>
  );
}

function hrefFor(path: string, filters: PublicPostFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.mode) params.set("mode", filters.mode);
  if (filters.workType) params.set("workType", filters.workType);
  if (filters.category) params.set("category", filters.category);
  if (filters.q) params.set("q", filters.q);
  if (filters.area) params.set("area", filters.area);
  if (filters.min !== undefined) params.set("min", String(filters.min));
  if (filters.max !== undefined) params.set("max", String(filters.max));
  if (filters.sort !== "latest") params.set("sort", filters.sort);
  if (filters.pageSize !== DEFAULT_PAGE_SIZE) params.set("pageSize", String(filters.pageSize));
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
