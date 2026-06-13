import type { FavoriteTarget } from "./types";

export const FAVORITE_TYPE_LABELS: Record<string, string> = {
  all: "全部",
  job: "招聘",
  housing: "房屋",
  marketplace: "二手",
  service: "服务",
  news: "新闻",
  navigation: "导航",
  dmv: "DMV",
};

export const FAVORITE_CENTER_TABS = [
  { value: "all", label: FAVORITE_TYPE_LABELS.all },
  { value: "job", label: FAVORITE_TYPE_LABELS.job },
  { value: "housing", label: FAVORITE_TYPE_LABELS.housing },
  { value: "marketplace", label: FAVORITE_TYPE_LABELS.marketplace },
  { value: "service", label: FAVORITE_TYPE_LABELS.service },
  { value: "news", label: FAVORITE_TYPE_LABELS.news },
  { value: "navigation", label: FAVORITE_TYPE_LABELS.navigation },
  { value: "dmv", label: FAVORITE_TYPE_LABELS.dmv },
] as const;

export const POST_FAVORITE_TYPE_LABELS: Record<string, string> = {
  job: "招聘信息",
  housing: "房屋信息",
  marketplace: "二手信息",
  service: "本地服务",
};

export function favoriteKey(target: Pick<FavoriteTarget, "type" | "id">) {
  return `${target.type}:${target.id}`;
}

export function favoriteCategory(type: string, category?: string | null) {
  return category?.trim() || FAVORITE_TYPE_LABELS[type] || "收藏";
}

export function normalizeFavoriteType(value?: string | null) {
  if (!value || value === "all") return "all";
  return FAVORITE_CENTER_TABS.some((tab) => tab.value === value) ? value : "all";
}
