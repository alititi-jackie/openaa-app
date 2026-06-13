import type { NavigationLink } from "@/features/navigation/types";
import { NavigationLinkCard } from "./NavigationLinkCard";

export function NavigationFeaturedSection({ links, favoriteKeys = new Set<string>() }: { links: NavigationLink[]; favoriteKeys?: Set<string> }) {
  if (links.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="text-lg font-black text-slate-950">推荐导航</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">纽约华人常用入口，适合先收藏到我的导航</p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {links.map((link) => (
          <NavigationLinkCard key={link.id} link={link} featured initialIsFavorited={favoriteKeys.has(`navigation:${link.id}`)} />
        ))}
      </div>
    </section>
  );
}
