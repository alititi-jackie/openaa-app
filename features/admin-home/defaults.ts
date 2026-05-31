import { fallbackLatestPostSections, fallbackQuickGridItems, fallbackSeoContent, fallbackTickerItems, fallbackTopQuickLinks, fallbackUtilityTools } from "@/features/home/fallbacks";
import { HOME_SECTION_KEYS } from "@/features/home/constants";

export const defaultHomeSections = [
  {
    key: HOME_SECTION_KEYS.quickGrid,
    title: "8 宫格入口",
    module: "home",
    is_visible: true,
    sort_order: 10,
    config: {
      items: fallbackQuickGridItems.map((item, index) => ({
        label: item.label,
        href: item.href,
        sort_order: index + 1,
        is_visible: true,
      })),
    },
  },
  {
    key: HOME_SECTION_KEYS.utilityTools,
    title: "实用工具",
    module: "home",
    is_visible: true,
    sort_order: 20,
    config: {
      items: fallbackUtilityTools.map((item, index) => ({
        title: item.title,
        description: item.description,
        href: item.href,
        icon: item.icon,
        theme: item.theme ?? "blue",
        cta: item.cta ?? "打开",
        sort_order: index + 1,
        is_visible: item.isVisible ?? true,
        open_mode: "same",
      })),
    },
  },
  {
    key: HOME_SECTION_KEYS.latestPosts,
    title: "最新发布",
    module: "home",
    is_visible: true,
    sort_order: 30,
    config: {
      sections: fallbackLatestPostSections.map((section) => ({
        title: section.title,
        post_type: section.postType,
        route: section.route,
        is_visible: section.isVisible,
        sort_order: section.sortOrder,
        limit_count: section.limitCount,
        layout: section.layout,
        description: section.description,
        empty_message: section.emptyMessage,
      })),
    },
  },
  {
    key: HOME_SECTION_KEYS.seoContent,
    title: "SEO 文案",
    module: "home",
    is_visible: fallbackSeoContent.isVisible,
    sort_order: 90,
    config: {
      title: fallbackSeoContent.title,
      content: fallbackSeoContent.content,
    },
  },
];

export const defaultTopQuickLinks = fallbackTopQuickLinks.map((item) => ({
  key: item.id,
  title: item.title,
  href: item.url,
  icon: item.icon ?? null,
  open_mode: item.open_mode,
  sort_order: item.sort_order,
  is_active: item.is_active,
}));

export const defaultLatestTicker = fallbackTickerItems.map((item, index) => ({
  title: item.label,
  href: item.href,
  module: "home",
  is_enabled: true,
  sort_order: index + 1,
}));
