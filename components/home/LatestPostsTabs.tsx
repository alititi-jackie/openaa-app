import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LatestPostGroup } from "./LatestPostsSection";
import { LatestPostsGrid } from "./LatestPostsGrid";

const latestPostQuickLinks = [
  { key: "jobs", label: "招聘", href: "/jobs" },
  { key: "housing", label: "房屋", href: "/housing" },
  { key: "marketplace", label: "二手", href: "/marketplace" },
  { key: "services", label: "本地服务", href: "/services" },
  { key: "news", label: "新闻", href: "/news" },
];

export function LatestPostsList({ groups }: { groups: LatestPostGroup[] }) {
  const visibleGroups = groups.filter((group) => group.isVisible !== false);

  return (
    <div className="space-y-5">
      <div className="-mx-1 flex flex-nowrap items-center gap-2 overflow-x-auto overflow-y-hidden px-1 py-1 [overscroll-behavior-x:contain] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {latestPostQuickLinks.map((link) => (
          <Link
            key={link.key}
            href={link.href}
            className="inline-flex min-h-8 shrink-0 items-center rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold leading-none text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 active:scale-[0.98]"
          >
            {link.label}
          </Link>
        ))}
      </div>

      {visibleGroups.length > 0 ? (
        visibleGroups.map((group) => (
          <section key={group.key} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-500">{group.title}</h3>
              <Link href={group.route} className="inline-flex shrink-0 items-center gap-0.5 text-xs font-bold text-blue-600">
                更多
                <ChevronRight size={13} aria-hidden="true" />
              </Link>
            </div>
            <LatestPostsGrid posts={group.posts} variant={group.layout} emptyMessage={group.emptyMessage ?? "暂无最新信息"} />
          </section>
        ))
      ) : (
        <p className="px-1 py-2 text-sm font-semibold text-slate-400">暂无最新信息</p>
      )}
    </div>
  );
}
