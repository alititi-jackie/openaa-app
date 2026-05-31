"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { LatestPostGroup } from "./LatestPostsSection";
import { HomeSectionNav } from "./HomeSectionNav";
import { LatestPostsGrid } from "./LatestPostsGrid";

export function LatestPostsTabs({ groups }: { groups: LatestPostGroup[] }) {
  const visibleGroups = groups.filter((group) => group.isVisible !== false);
  const [first] = visibleGroups;
  const [activeKey, setActiveKey] = useState(first?.key ?? "");
  const activeGroup = visibleGroups.find((group) => group.key === activeKey) ?? first;

  if (!activeGroup) {
    return null;
  }

  return (
    <div className="space-y-3">
      <HomeSectionNav items={visibleGroups.map((group) => ({ key: group.key, label: group.navLabel ?? group.title }))} activeKey={activeGroup.key} onSelect={setActiveKey} />
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-black text-slate-950">{activeGroup.title}</h3>
            {activeGroup.description ? <p className="mt-0.5 truncate text-sm text-slate-500">{activeGroup.description}</p> : null}
          </div>
          <Link href={activeGroup.route} className="inline-flex shrink-0 items-center gap-0.5 text-sm font-bold text-blue-600">
            更多
            <ChevronRight size={15} aria-hidden="true" />
          </Link>
        </div>
        <LatestPostsGrid posts={activeGroup.posts} variant={activeGroup.layout} />
      </div>
    </div>
  );
}
