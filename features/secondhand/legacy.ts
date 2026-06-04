import { LOCATION_OPTIONS } from "@/features/posts/formMappers";
import type { MarketplaceDetailRecord, PostCardView, PostDetailView, PostRecord } from "@/features/posts/types";

export type SecondhandMode = "selling" | "buying";

export const ALL_SECONDHAND_REGIONS = "全部地区";
export const SECONDHAND_REGIONS = [ALL_SECONDHAND_REGIONS, ...LOCATION_OPTIONS] as const;
export const SECONDHAND_CATEGORIES = ["生活用品", "母婴用品", "电子产品", "服饰箱包", "办公用品", "宠物", "家具家电", "其它二手"] as const;

export const secondhandTabs: Array<{ key: SecondhandMode; label: string }> = [
  { key: "selling", label: "出售商品" },
  { key: "buying", label: "求购信息" },
];

export function firstMarketplaceDetail(record: PostRecord): MarketplaceDetailRecord | null {
  const value = record.post_details_marketplace;
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function normalizeSecondhandMode(value?: string | null): SecondhandMode {
  const text = String(value ?? "").trim().toLowerCase();
  if (["buying", "wanted", "seeking", "求购", "求购信息"].includes(text)) return "buying";
  return "selling";
}

export function inferSecondhandMode(record: PostRecord): SecondhandMode {
  const detail = firstMarketplaceDetail(record);
  const metadataMode = typeof record.metadata?.secondhand_mode === "string" ? record.metadata.secondhand_mode : typeof record.metadata?.marketplace_mode === "string" ? record.metadata.marketplace_mode : null;
  if (metadataMode) return normalizeSecondhandMode(metadataMode);
  if (detail?.listing_type) return normalizeSecondhandMode(detail.listing_type);
  return normalizeSecondhandMode(record.category || record.subcategory || record.title);
}

export function getSecondhandModeFromCard(post: PostCardView | PostDetailView): SecondhandMode {
  return post.marketplace?.mode ?? "selling";
}

export function secondhandModeLabel(mode: SecondhandMode) {
  return mode === "buying" ? "求购" : "出售";
}

export function formatSecondhandPrice(value: number | string | null | undefined, mode: SecondhandMode = "selling") {
  if (value === null || value === undefined || value === "") return mode === "buying" ? "预算面议" : "价格面议";
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return mode === "buying" ? "预算面议" : "价格面议";
  return mode === "buying" ? `预算：$${numeric.toLocaleString("en-US")}` : `$${numeric.toLocaleString("en-US")}`;
}

export function formatSecondhandLocation(value?: string | null) {
  return value || "纽约 New York";
}

export function isEffectivePinned(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) return false;
  const pinned = Boolean(metadata.is_pinned ?? metadata.pinned);
  if (!pinned) return false;
  const expiresAt = typeof metadata.pinned_until === "string" ? metadata.pinned_until : typeof metadata.pinnedUntil === "string" ? metadata.pinnedUntil : null;
  if (!expiresAt) return true;
  const date = new Date(expiresAt);
  return Number.isNaN(date.getTime()) ? true : date.getTime() > Date.now();
}

export function pinnedOrder(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) return 0;
  const value = metadata.pinned_order ?? metadata.pinnedOrder ?? metadata.priority;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function matchesSecondhandSearch(record: PostRecord, keyword: string, category: string, region: string) {
  const detail = firstMarketplaceDetail(record);
  const normalizedKeyword = keyword.trim().toLowerCase();
  const categoryOk = !category || detail?.item_category === category || record.category === category;
  const regionOk = !region || region === ALL_SECONDHAND_REGIONS || detail?.trade_area === region;
  if (!categoryOk || !regionOk) return false;
  if (!normalizedKeyword) return true;

  return [record.title, record.summary, record.body, record.category, detail?.item_category, detail?.trade_area, detail?.condition]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedKeyword));
}
