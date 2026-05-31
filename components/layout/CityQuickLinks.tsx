"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TopQuickLink } from "@/features/navigation/topQuickLinks";

type CityQuickLinksProps = {
  links: TopQuickLink[];
  onNavigate?: () => void;
};

export function CityQuickLinks({ links, onNavigate }: CityQuickLinksProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateScrollState() {
    const element = scrollRef.current;
    if (!element) return;
    const maxScrollLeft = element.scrollWidth - element.clientWidth;
    setCanScrollLeft(element.scrollLeft > 4);
    setCanScrollRight(element.scrollLeft < maxScrollLeft - 4);
  }

  useEffect(() => {
    const timer = window.setTimeout(updateScrollState, 0);
    window.addEventListener("resize", updateScrollState);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  function scrollBy(left: number) {
    scrollRef.current?.scrollBy({ left, behavior: "smooth" });
  }

  return (
    <div className="border-t border-slate-100 bg-white/95 px-3 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
      <div className="relative md:px-4">
        <button
          type="button"
          aria-label="快捷导航向左滚动"
          disabled={!canScrollLeft}
          onClick={() => scrollBy(-180)}
          className="absolute left-0 top-1/2 z-10 hidden h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm disabled:pointer-events-none disabled:opacity-30 md:flex"
        >
          <ChevronLeft size={15} />
        </button>
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="flex flex-nowrap gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap py-1 [overscroll-behavior-x:contain] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {links.map((item) => (
            <Link
              key={item.id}
              href={item.url}
              target={item.open_mode === "new" ? "_blank" : undefined}
              rel={item.open_mode === "new" ? "noopener noreferrer" : undefined}
              onClick={onNavigate}
              className="inline-flex min-h-9 shrink-0 items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold leading-none text-blue-700 transition-colors hover:bg-blue-100"
            >
              {item.title}
            </Link>
          ))}
        </div>
        <button
          type="button"
          aria-label="快捷导航向右滚动"
          disabled={!canScrollRight}
          onClick={() => scrollBy(180)}
          className="absolute right-0 top-1/2 z-10 hidden h-7 w-7 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm disabled:pointer-events-none disabled:opacity-30 md:flex"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
