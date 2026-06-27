import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type AdminPaginationProps = {
  page: number;
  pageCount: number;
  totalCount: number;
  itemLabel?: string;
  summary?: ReactNode;
  previousHref: string;
  nextHref: string;
  hasPrevious?: boolean;
  hasNext?: boolean;
  showDisabled?: boolean;
  className?: string;
  buttonClassName?: string;
  previousLabel?: string;
  nextLabel?: string;
  ariaLabel?: string;
};

const defaultContainerClassName = "mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600";
const defaultButtonClassName = "rounded-full bg-white px-3 py-1.5 text-xs font-black text-blue-700";

export function AdminPagination({
  page,
  pageCount,
  totalCount,
  itemLabel = "条",
  summary,
  previousHref,
  nextHref,
  hasPrevious = page > 1,
  hasNext = page < pageCount,
  showDisabled = false,
  className,
  buttonClassName,
  previousLabel = "上一页",
  nextLabel = "下一页",
  ariaLabel = "后台分页",
}: AdminPaginationProps) {
  return (
    <nav className={cn(defaultContainerClassName, className)} aria-label={ariaLabel}>
      <span>{summary ?? <>共 {totalCount} {itemLabel} · 第 {page} / {pageCount} 页</>}</span>
      <div className="flex flex-wrap gap-2">
        {hasPrevious || showDisabled ? (
          <Link
            href={previousHref}
            aria-disabled={!hasPrevious}
            className={cn(defaultButtonClassName, "aria-disabled:pointer-events-none aria-disabled:opacity-40", buttonClassName)}
          >
            {previousLabel}
          </Link>
        ) : null}
        {hasNext || showDisabled ? (
          <Link
            href={nextHref}
            aria-disabled={!hasNext}
            className={cn(defaultButtonClassName, "aria-disabled:pointer-events-none aria-disabled:opacity-40", buttonClassName)}
          >
            {nextLabel}
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
