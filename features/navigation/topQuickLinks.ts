export type TopQuickLinkOpenMode = "same" | "new";

export type TopQuickLink = {
  id: string;
  title: string;
  url: string;
  open_mode: TopQuickLinkOpenMode;
  sort_order: number;
  is_active: boolean;
  city_id: string | null;
  icon?: string;
};

export const fallbackTopQuickLinks: TopQuickLink[] = [
  { id: "home", title: "首页", url: "/", open_mode: "same", sort_order: 0, is_active: true, city_id: "ny", icon: "home" },
  { id: "jobs", title: "招聘", url: "/jobs", open_mode: "same", sort_order: 10, is_active: true, city_id: "ny", icon: "briefcase" },
  { id: "housing", title: "房屋", url: "/housing", open_mode: "same", sort_order: 20, is_active: true, city_id: "ny", icon: "building" },
  { id: "marketplace", title: "二手", url: "/secondhand", open_mode: "same", sort_order: 30, is_active: true, city_id: "ny", icon: "shopping-bag" },
  { id: "dmv", title: "DMV", url: "/dmv", open_mode: "same", sort_order: 40, is_active: true, city_id: "ny", icon: "car" },
  { id: "navigation", title: "导航", url: "/navigation", open_mode: "same", sort_order: 50, is_active: true, city_id: "ny", icon: "map" },
  { id: "news", title: "新闻", url: "/news", open_mode: "same", sort_order: 60, is_active: true, city_id: "ny", icon: "newspaper" },
  { id: "services", title: "本地服务", url: "/services", open_mode: "same", sort_order: 70, is_active: true, city_id: "ny", icon: "store" },
];

export function getFallbackTopQuickLinks(cityId = "ny") {
  return fallbackTopQuickLinks
    .filter((item) => item.is_active && (!item.city_id || item.city_id === cityId))
    .sort((a, b) => a.sort_order - b.sort_order);
}
