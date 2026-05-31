import { HomeSectionShell } from "./HomeSectionShell";
import { UtilityCarousel } from "./UtilityCarousel";

export type UtilityIconKey = "dmv" | "ticket" | "navigation" | "guide";
export type UtilityTheme = "blue" | "orange" | "cyan" | "amber";

export type UtilityCardItem = {
  title: string;
  description: string;
  href: string;
  icon: UtilityIconKey;
  theme?: UtilityTheme;
  cta?: string;
  isVisible?: boolean;
};

export function UtilityCards({ items, isVisible = true }: { items: UtilityCardItem[]; isVisible?: boolean }) {
  const visibleItems = items.filter((item) => item.isVisible !== false);

  if (!isVisible || visibleItems.length === 0) {
    return null;
  }

  return (
    <HomeSectionShell title="实用工具">
      <UtilityCarousel items={visibleItems} />
    </HomeSectionShell>
  );
}
