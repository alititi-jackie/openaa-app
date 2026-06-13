import type { NavigationCategory, NavigationLink } from "@/features/navigation/types";
import { NavigationLinkCard } from "./NavigationLinkCard";

type NavigationCategoryGroup = {
  category: NavigationCategory;
  links: NavigationLink[];
};

export function NavigationCategorySections({
  categories,
  links,
  q,
  favoriteKeys = new Set<string>(),
}: {
  categories: NavigationCategory[];
  links: NavigationLink[];
  q: string;
  favoriteKeys?: Set<string>;
}) {
  const groups = categories
    .map((category) => ({
      category,
      links: links.filter((link) => link.categorySlug === category.slug || link.categoryId === category.id),
    }))
    .filter((group) => group.links.length > 0);

  if (groups.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-100 bg-white px-4 py-6 text-center shadow-sm">
        <h2 className="text-sm font-black text-slate-950">{q ? "没有匹配的导航链接" : "导航内容正在整理中"}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{q ? "换个关键词试试，或切回全部分类查看。" : "后台启用公开导航后，这里会按分类展示常用入口。"}</p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <NavigationCategorySection key={group.category.slug} group={group} favoriteKeys={favoriteKeys} />
      ))}
    </div>
  );
}

function NavigationCategorySection({ group, favoriteKeys }: { group: NavigationCategoryGroup; favoriteKeys: Set<string> }) {
  return (
    <section id={`navigation-${group.category.slug}`} className="scroll-mt-28 space-y-2">
      <div className="px-1">
        <h2 className="text-base font-black text-slate-950">{group.category.name}</h2>
        {group.category.description ? <p className="mt-1 text-xs leading-5 text-slate-500">{group.category.description}</p> : null}
      </div>
      <div className="rounded-3xl border border-slate-100 bg-white p-3 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          {group.links.map((link) => (
            <NavigationLinkCard key={link.id} link={link} initialIsFavorited={favoriteKeys.has(`navigation:${link.id}`)} />
          ))}
        </div>
      </div>
    </section>
  );
}
