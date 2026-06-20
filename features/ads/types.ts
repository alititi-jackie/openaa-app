export type AdPosition = "home" | "jobs" | "housing" | "secondhand" | "navigation" | "services" | "news" | "dmv";
export type AdStatusFilter = "all" | "active" | "inactive";
export type AdOpenMode = "internal" | "external_new" | "external_same";
export type AdLinkType = "internal" | "external";

export type AdminAdRow = {
  id: string;
  image_asset_id: string | null;
  image_url: string | null;
  image_source_type: "storage" | "external" | null;
  link_url: string | null;
  link_type: AdLinkType;
  external_url: string | null;
  slug: string | null;
  content: string | null;
  contact_name: string | null;
  phone: string | null;
  wechat: string | null;
  open_mode: AdOpenMode;
  position: AdPosition;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  sort_order: number;
  created_at: string;
};

export const adPositions: Array<{ key: AdPosition; label: string }> = [
  { key: "home", label: "首页广告" },
  { key: "jobs", label: "招聘广告" },
  { key: "housing", label: "房屋广告" },
  { key: "secondhand", label: "二手广告" },
  { key: "navigation", label: "导航广告" },
  { key: "services", label: "本地服务广告" },
  { key: "news", label: "新闻广告" },
  { key: "dmv", label: "DMV广告" },
];

export const adStatusFilters: Array<{ key: AdStatusFilter; label: string }> = [
  { key: "all", label: "全部状态" },
  { key: "active", label: "启用中" },
  { key: "inactive", label: "已停用" },
];

export function normalizeAdPosition(value: string | null | undefined): AdPosition | null {
  return adPositions.some((item) => item.key === value) ? (value as AdPosition) : null;
}

export function normalizeAdStatusFilter(value: string | null | undefined): AdStatusFilter | null {
  return adStatusFilters.some((item) => item.key === value) ? (value as AdStatusFilter) : null;
}
