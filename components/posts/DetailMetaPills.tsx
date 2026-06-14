"use client";

import { PostViewTracker } from "./PostViewTracker";
import { formatPostTime, formatViewCount } from "@/features/posts/display";

export type DetailMetaPill = {
  key?: string;
  group?: "common" | "business";
  label: string;
  tone?: "blue" | "orange" | "gray" | "service";
  value: string;
};

type DetailMetaPillsProps = {
  items: DetailMetaPill[];
  postId: string;
  initialViewCount: number;
  trackViews?: boolean;
  oneLine?: boolean;
  className?: string;
};

const toneClass: Record<NonNullable<DetailMetaPill["tone"]>, string> = {
  blue: "border-blue-100 bg-blue-50 text-blue-700",
  orange: "border-orange-100 bg-orange-50 text-orange-700",
  gray: "border-slate-200 bg-slate-50 text-slate-600",
  service: "border-cyan-100 bg-cyan-50 text-cyan-700",
};

function isViewsPill(item: DetailMetaPill) {
  return item.key === "views";
}

function isPublishedAtPill(item: DetailMetaPill) {
  return item.key === "publishedAt";
}

function displayValue(item: DetailMetaPill) {
  if (isViewsPill(item)) {
    return formatViewCount(item.value, { icon: true, unit: true });
  }

  if (isPublishedAtPill(item)) {
    return formatPostTime(item.value, "relative");
  }

  return item.value;
}

function pillClass(item: DetailMetaPill, index: number) {
  const base = "rounded-full border px-2.5 py-1 text-xs font-medium shadow-[0_1px_3px_rgba(15,23,42,0.05)] sm:px-3 sm:text-sm";

  if (item.tone) {
    return `${base} ${toneClass[item.tone]}`;
  }

  return `${base} border-slate-200 bg-white ${index >= 3 ? "text-slate-800" : "text-slate-500"}`;
}

export function DetailMetaPills({ items, postId, initialViewCount, trackViews = true, oneLine = false, className }: DetailMetaPillsProps) {
  const visibleItems = items.filter((item) => item.value.trim());
  const indexedItems = visibleItems.map((item, index) => ({ item, index }));
  const groupedItems = indexedItems.filter(({ item }) => item.group);
  const hasGroups = groupedItems.length > 0;

  if (visibleItems.length === 0) {
    return null;
  }

  const renderPill = (item: DetailMetaPill, index: number) =>
    isViewsPill(item) && trackViews ? (
      <PostViewTracker key={item.key ?? item.label} postId={postId} initialViewCount={initialViewCount} className={pillClass(item, index)} />
    ) : (
      <span key={`${item.key ?? item.label}-${item.value}`} className={pillClass(item, index)}>
        {displayValue(item)}
      </span>
    );

  if (hasGroups) {
    const commonItems = indexedItems.filter(({ item }) => item.group === "common");
    const businessItems = indexedItems.filter(({ item }) => item.group === "business");
    const remainingItems = indexedItems.filter(({ item }) => !item.group);
    const groupClass = [
      "flex flex-nowrap gap-1.5 sm:max-w-full sm:flex-none sm:gap-2 [&>span]:shrink-0 [&>span]:whitespace-nowrap",
      oneLine ? "max-w-full overflow-hidden pb-0" : "overflow-x-auto pb-0.5 sm:overflow-visible sm:pb-0",
    ].join(" ");
    const businessGroupClass = oneLine ? groupClass : `${groupClass} sm:flex-wrap`;
    const containerClass = oneLine
      ? "mt-4 flex max-w-full overflow-hidden gap-1.5 sm:gap-2"
      : "mt-4 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2";

    return (
      <div className={[containerClass, className].filter(Boolean).join(" ")}>
        {commonItems.length ? <div className={groupClass}>{commonItems.map(({ item, index }) => renderPill(item, index))}</div> : null}
        {businessItems.length ? (
          <div className={businessGroupClass}>{businessItems.map(({ item, index }) => renderPill(item, index))}</div>
        ) : null}
        {remainingItems.length ? <div className={groupClass}>{remainingItems.map(({ item, index }) => renderPill(item, index))}</div> : null}
      </div>
    );
  }

  return (
    <div className={[oneLine ? "mt-4 flex max-w-full flex-nowrap gap-1.5 overflow-hidden sm:gap-2 [&>span]:shrink-0 [&>span]:whitespace-nowrap" : "mt-4 flex flex-wrap gap-1.5 sm:gap-2", className].filter(Boolean).join(" ")}>
      {indexedItems.map(({ item, index }) => renderPill(item, index))}
    </div>
  );
}
