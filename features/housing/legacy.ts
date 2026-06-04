import { LOCATION_OPTIONS } from "@/features/posts/formMappers";
import type { HousingDetailRecord, PostCardView, PostDetailView, PostRecord } from "@/features/posts/types";

export type HousingMode = "renting" | "seeking";

export const ALL_HOUSING_REGIONS = "全部地区";
export const HOUSING_REGIONS = [ALL_HOUSING_REGIONS, ...LOCATION_OPTIONS] as const;

export const housingTabs: Array<{ key: HousingMode; label: string }> = [
  { key: "renting", label: "房源信息" },
  { key: "seeking", label: "求租求购" },
];

export function firstHousingDetail(record: PostRecord): HousingDetailRecord | null {
  const value = record.post_details_housing;
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function normalizeHousingMode(value?: string | null): HousingMode {
  const text = String(value ?? "").trim().toLowerCase();
  if (["seeking", "seek", "wanted", "buying", "求租", "求购", "求租求购"].includes(text)) return "seeking";
  return "renting";
}

export function inferHousingMode(record: PostRecord): HousingMode {
  const detail = firstHousingDetail(record);
  const metadataMode = typeof record.metadata?.housing_mode === "string" ? record.metadata.housing_mode : null;
  if (metadataMode) return normalizeHousingMode(metadataMode);
  if (detail?.listing_type) return normalizeHousingMode(detail.listing_type);
  return normalizeHousingMode(record.category || record.subcategory || record.title);
}

export function getHousingModeFromCard(post: PostCardView | PostDetailView): HousingMode {
  return post.housing?.mode ?? "renting";
}

export function housingModeLabel(mode: HousingMode) {
  return mode === "seeking" ? "求租" : "出租";
}

export function formatHousingDate(value: string | null | undefined) {
  if (!value) return "最新";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "最新";
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

export function formatHousingPrice(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "面议";
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "面议";
  return `$${numeric.toLocaleString("en-US")}/月`;
}

export function formatHousingLocation(value?: string | null) {
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

export function matchesHousingSearch(record: PostRecord, keyword: string, region: string) {
  const detail = firstHousingDetail(record);
  const normalizedKeyword = keyword.trim().toLowerCase();
  const regionOk = !region || region === ALL_HOUSING_REGIONS || detail?.address_area === region;
  if (!regionOk) return false;
  if (!normalizedKeyword) return true;

  return [record.title, record.summary, record.body, record.category, detail?.address_area, detail?.housing_type, detail?.listing_type]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedKeyword));
}
