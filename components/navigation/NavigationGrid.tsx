import { EmptyState } from "@/components/common/EmptyState";
import type { NavigationLink } from "@/features/navigation/types";
import { NavigationCard } from "./NavigationCard";

export function NavigationGrid({ links, emptyTitle = "暂时没有导航链接" }: { links: NavigationLink[]; emptyTitle?: string }) {
  if (links.length === 0) {
    return <EmptyState title={emptyTitle} description="导航内容会从后台配置读取；当前没有可公开显示的链接。" />;
  }

  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {links.map((link) => (
        <NavigationCard key={link.id} link={link} />
      ))}
    </section>
  );
}
