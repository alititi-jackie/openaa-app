"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

export type HorizontalPillTab = {
  value: string;
  label: string;
  href?: string;
};

type HorizontalPillTabsProps = {
  tabs: readonly HorizontalPillTab[];
  activeValue: string;
  ariaLabel: string;
  className?: string;
  onChange?: (value: string) => void;
};

const SCROLL_DISTANCE = 200;

export function HorizontalPillTabs({ tabs, activeValue, ariaLabel, className, onChange }: HorizontalPillTabsProps) {
  const allTab = tabs.find((tab) => tab.value === "all") ?? tabs[0];
  const restTabs = tabs.filter((tab) => tab !== allTab);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const maxScrollLeft = element.scrollWidth - element.clientWidth;
    setCanScrollLeft(element.scrollLeft > 4);
    setCanScrollRight(maxScrollLeft > 4 && element.scrollLeft < maxScrollLeft - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    const element = scrollRef.current;
    if (!element) return;

    element.addEventListener("scroll", updateScrollState, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(element);
    resizeObserver.observe(document.body);

    return () => {
      element.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
    };
  }, [tabs, updateScrollState]);

  if (!allTab) return null;

  function scrollBy(left: number) {
    scrollRef.current?.scrollBy({ left, behavior: "smooth" });
  }

  return (
    <nav aria-label={ariaLabel} className={cn("max-w-full", className)}>
      <div className="flex max-w-full items-center gap-2">
        <Pill tab={allTab} active={activeValue === allTab.value} onChange={onChange} />

        {restTabs.length > 0 ? (
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center">
              <button
                type="button"
                onClick={() => scrollBy(-SCROLL_DISTANCE)}
                disabled={!canScrollLeft}
                className="mr-1 hidden h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50 disabled:cursor-default disabled:opacity-30 md:flex"
                aria-label="向左滚动"
              >
                ‹
              </button>

              <div
                ref={scrollRef}
                className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden whitespace-nowrap py-1 [touch-action:pan-x] [overscroll-behavior-x:contain] [overscroll-behavior-y:contain] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="region"
                aria-label={ariaLabel}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "ArrowLeft") scrollBy(-SCROLL_DISTANCE);
                  if (event.key === "ArrowRight") scrollBy(SCROLL_DISTANCE);
                }}
              >
                <div className="flex flex-nowrap items-center gap-2">
                  {restTabs.map((tab) => (
                    <Pill key={tab.value} tab={tab} active={activeValue === tab.value} onChange={onChange} />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => scrollBy(SCROLL_DISTANCE)}
                disabled={!canScrollRight}
                className="ml-1 hidden h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50 disabled:cursor-default disabled:opacity-30 md:flex"
                aria-label="向右滚动"
              >
                ›
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}

function Pill({ tab, active, onChange }: { tab: HorizontalPillTab; active: boolean; onChange?: (value: string) => void }) {
  const className = cn(
    "inline-flex min-h-8 flex-shrink-0 items-center rounded-full border px-3 py-1.5 text-sm font-medium leading-none transition",
    active ? "border-[#1976d2] bg-[#1976d2] text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
  );

  if (tab.href) {
    return (
      <Link href={tab.href} aria-current={active ? "page" : undefined} className={className}>
        {tab.label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => onChange?.(tab.value)} aria-pressed={active} className={className}>
      {tab.label}
    </button>
  );
}
