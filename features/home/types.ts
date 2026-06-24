import type { LucideIcon } from "lucide-react";
import type { HomeBannerItem } from "@/components/home/HomeBanner";
import type { LatestPostGroup } from "@/components/home/LatestPostsSection";
import type { QuickGridItem } from "@/components/home/QuickGrid";
import type { UtilityCardItem } from "@/components/home/UtilityCards";
import type { TopQuickLink } from "@/features/navigation/topQuickLinks";

export type HomeCity = {
  id: string | null;
  slug: string;
  name: string;
};

export type HomeTickerItem = {
  label: string;
  href: string;
  module?: string | null;
};

export type HomeTickerGlobalSettings = {
  isEnabled: boolean;
  intervalSeconds: number;
};

export type HomeTickerSectionSettings = {
  sectionKey: string;
  sectionName: string;
  isEnabled: boolean;
  sortOrder: number;
  displayCount: number;
};

export type HomeTickerSettings = {
  global: HomeTickerGlobalSettings;
  sections: HomeTickerSectionSettings[];
};

export type HomeSeoContent = {
  title: string;
  content: string;
  isVisible: boolean;
};

export type HomeSectionRecord = {
  key: string;
  title: string;
  description: string | null;
  module: string;
  config: Record<string, unknown> | null;
  is_visible: boolean;
  sort_order: number;
};

export type HomeLatestPostSectionConfig = {
  key: string;
  title: string;
  navLabel: string;
  postType: "job" | "housing" | "marketplace" | "service" | "news";
  route: string;
  isVisible: boolean;
  sortOrder: number;
  limitCount: number;
  layout: "grid" | "media" | "news";
  description: string;
  emptyMessage: string;
};

export type HomeQuickGridConfigItem = Omit<QuickGridItem, "icon"> & {
  icon: LucideIcon;
  sortOrder: number;
  isVisible: boolean;
  featureKey?: string;
};

export type HomeConfig = {
  city: HomeCity;
  topQuickLinks: TopQuickLink[];
  banners: HomeBannerItem[];
  adPlaceholderImageUrl: string | null;
  tickerItems: HomeTickerItem[];
  tickerSettings: HomeTickerSettings;
  quickGridItems: QuickGridItem[];
  utilityTools: UtilityCardItem[];
  latestPostGroups: LatestPostGroup[];
  latestPostsVisible: boolean;
  utilityToolsVisible: boolean;
  quickGridVisible: boolean;
  seo: HomeSeoContent;
};
