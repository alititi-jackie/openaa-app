export const NEWS_CATEGORY_ALL = "all";

export const DEFAULT_NEWS_CATEGORIES = [
  { slug: "local-news", name: "本地新闻", sort_order: 10 },
  { slug: "newcomer-guide", name: "新手指南", sort_order: 20 },
  { slug: "dmv-guide", name: "DMV 教程", sort_order: 30 },
  { slug: "life-guide", name: "生活指南", sort_order: 40 },
  { slug: "announcement", name: "平台公告", sort_order: 50 },
] as const;

export const NEWS_STATUS_OPTIONS = ["draft", "published", "hidden", "deleted"] as const;
export const ADMIN_NEWS_LIMIT = 50;
export const PUBLIC_NEWS_LIMIT = 20;
export const HOME_NEWS_LIMIT = 4;
export const NEWS_DEFAULT_DESCRIPTION = "纽约华人本地新闻、新手指南、DMV 教程、生活指南和平台公告。";
export const NEWS_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ALLOWED_NEWS_COVER_HOSTS = new Set(["img.openaa.com"]);
