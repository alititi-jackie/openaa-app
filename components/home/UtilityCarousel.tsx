"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { UtilityCardItem } from "./UtilityCards";
import { UtilityCard } from "./UtilityCard";

export function UtilityCarousel({ items }: { items: UtilityCardItem[] }) {
  const pages = useMemo(() => chunk(items.filter((item) => item.isVisible !== false), 2), [items]);
  const [activePage, setActivePage] = useState(0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  if (pages.length === 0) {
    return null;
  }

  function goToPage(page: number) {
    const nextPage = (page + pages.length) % pages.length;
    setActivePage(nextPage);
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTo({ left: nextPage * scroller.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="relative">
      {pages.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => goToPage(activePage - 1)}
            className="absolute -left-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 md:grid"
            aria-label="上一组实用工具"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goToPage(activePage + 1)}
            className="absolute -right-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 md:grid"
            aria-label="下一组实用工具"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </>
      ) : null}
      <div
        ref={scrollerRef}
        onScroll={(event) => {
          const page = Math.round(event.currentTarget.scrollLeft / Math.max(event.currentTarget.clientWidth, 1));
          setActivePage(Math.min(Math.max(page, 0), pages.length - 1));
        }}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [overscroll-behavior-x:contain] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {pages.map((page, index) => (
          <div key={index} className="grid w-full shrink-0 snap-start grid-cols-2 gap-2 sm:gap-3">
            {page.map((item) => (
              <UtilityCard key={item.href} item={item} />
            ))}
          </div>
        ))}
      </div>
      {pages.length > 1 ? (
        <div className="mt-2 flex justify-center gap-1.5">
          {pages.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToPage(index)}
              className={`h-1.5 rounded-full transition-all ${index === activePage ? "w-5 bg-blue-600" : "w-1.5 bg-slate-300"}`}
              aria-label={`切换到第 ${index + 1} 组实用工具`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    pages.push(items.slice(index, index + size));
  }
  return pages;
}
