"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { NavigationCategory, NavigationLink } from "@/features/navigation/types";
import { NavigationLinkCard } from "./NavigationLinkCard";

type NavigationGroup = {
  category: NavigationCategory;
  links: NavigationLink[];
};

const SHORT_LABELS: Record<string, string> = {
  featured: "热门",
  government: "政府",
  finance: "银行",
  shopping: "购物",
  telecom: "通讯",
  ai: "AI",
  video: "视频",
  social: "社交",
  life: "生活",
  other: "其它",
};

export function NavigationPublicSections({ categories, links }: { categories: NavigationCategory[]; links: NavigationLink[] }) {
  const [activeSlug, setActiveSlug] = useState("all");
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const groups = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          links: links.filter((link) => link.categorySlug === category.slug || link.categoryId === category.id),
        }))
        .filter((group) => group.links.length > 0),
    [categories, links],
  );

  const selectCategory = useCallback(
    (slug: string) => {
      setActiveSlug(slug);
      if (slug === "all") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      document.getElementById(sectionId(slug))?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [],
  );

  if (groups.length === 0) {
    return (
      <section className="rounded-3xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
        导航内容正在整理中，请稍后再来。
      </section>
    );
  }

  return (
    <>
      <nav className="sticky top-14 z-30 -mx-4 border-b border-slate-100 bg-white/95 px-4 py-2 backdrop-blur" aria-label="导航分类">
        <div className="flex items-center gap-2">
          <button type="button" className={tabClass(activeSlug === "all")} onClick={() => selectCategory("all")}>
            全部
          </button>
          <div className="relative flex min-w-0 flex-1 items-center">
            <button type="button" className="mr-1 hidden h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm md:flex" onClick={() => scrollerRef.current?.scrollBy({ left: -200, behavior: "smooth" })} aria-label="向左滚动">
              ‹
            </button>
            <div ref={scrollerRef} className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden whitespace-nowrap py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex flex-nowrap items-center gap-2">
                {groups.map((group) => (
                  <button key={group.category.slug} type="button" className={tabClass(activeSlug === group.category.slug)} onClick={() => selectCategory(group.category.slug)}>
                    {SHORT_LABELS[group.category.slug] ?? group.category.name}
                  </button>
                ))}
              </div>
            </div>
            <button type="button" className="ml-1 hidden h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm md:flex" onClick={() => scrollerRef.current?.scrollBy({ left: 200, behavior: "smooth" })} aria-label="向右滚动">
              ›
            </button>
          </div>
        </div>
      </nav>

      <div className="space-y-5">
        {groups.map((group) => (
          <NavigationPublicSection key={group.category.slug} group={group} />
        ))}
      </div>
    </>
  );
}

function NavigationPublicSection({ group }: { group: NavigationGroup }) {
  const [expanded, setExpanded] = useState(false);
  const displayLimit = group.category.displayLimit || 50;
  const visibleLinks = expanded ? group.links : group.links.slice(0, displayLimit);
  const canExpand = group.links.length > displayLimit;

  return (
    <section id={sectionId(group.category.slug)} className="scroll-mt-28">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-[14px] font-black text-slate-950 md:text-[15px]">{group.category.name}</h2>
        {canExpand ? (
          <button type="button" onClick={() => setExpanded((value) => !value)} className="text-xs font-bold text-blue-600 hover:text-blue-700">
            {expanded ? "收起" : `更多 (${group.links.length})`}
          </button>
        ) : null}
      </div>
      <div className="rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {visibleLinks.map((link) => (
            <NavigationLinkCard key={link.id} link={link} />
          ))}
        </div>
      </div>
    </section>
  );
}

function sectionId(slug: string) {
  return `navigation-${slug}`;
}

function tabClass(active: boolean) {
  return [
    "inline-flex min-h-8 shrink-0 items-center rounded-full border px-3 py-1.5 text-sm font-medium leading-none transition",
    active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
  ].join(" ");
}
