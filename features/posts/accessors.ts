import { POST_TYPE_TO_ROUTE } from "./constants";
import { numberText, numericOrUndefined, postModeLabel, postTypeFallbackLabel, wageUnitLabel } from "./display";
import type {
  HousingDetailRecord,
  JobDetailRecord,
  MarketplaceDetailRecord,
  PostCardView,
  PostImageRecord,
  PostRecord,
  PostStatsRecord,
  PostType,
  ServiceDetailRecord,
} from "./types";

export function firstOrNull<T>(value: T[] | T | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function postStats(record: PostRecord): PostStatsRecord {
  return firstOrNull(record.post_stats) ?? { favorite_count: 0, view_count: 0 };
}

export function postImageUrl(image: PostImageRecord | null) {
  return image?.image_assets?.public_url || image?.image_assets?.external_url || undefined;
}

export function getSortedPostImages(record: PostRecord) {
  return [...(record.post_images ?? [])].sort(
    (a, b) => Number(Boolean(b.is_cover)) - Number(Boolean(a.is_cover)) || (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
}

export function getPostCoverUrl(record: PostRecord) {
  return postImageUrl(getSortedPostImages(record)[0] ?? null);
}

export function getPostImageViews(record: PostRecord) {
  return getSortedPostImages(record).flatMap((image) => {
    const url = postImageUrl(image);
    return url ? [{ url, caption: image.caption, imageAssetId: image.image_asset_id ?? null }] : [];
  });
}

export function getJobDetail(record: PostRecord) {
  return firstOrNull(record.post_details_jobs) as JobDetailRecord | null;
}

export function getHousingDetail(record: PostRecord) {
  return firstOrNull(record.post_details_housing) as HousingDetailRecord | null;
}

export function getMarketplaceDetail(record: PostRecord) {
  return firstOrNull(record.post_details_marketplace) as MarketplaceDetailRecord | null;
}

export function getServiceDetail(record: PostRecord) {
  return firstOrNull(record.post_details_services) as ServiceDetailRecord | null;
}

export function getPostArea(record: PostRecord) {
  if (record.post_type === "job") return getJobDetail(record)?.work_area ?? "";
  if (record.post_type === "housing") return getHousingDetail(record)?.address_area ?? "";
  if (record.post_type === "marketplace") return getMarketplaceDetail(record)?.trade_area ?? "";
  return getServiceDetail(record)?.service_area ?? "";
}

export function getPostMode(record: PostRecord) {
  if (record.subcategory) return record.subcategory;
  if (record.post_type === "housing") return getHousingDetail(record)?.listing_type ?? "";
  if (record.post_type === "marketplace") return getMarketplaceDetail(record)?.listing_type ?? "";
  if (record.post_type === "job") return "";
  return "";
}

export function getPostCategory(record: PostRecord) {
  if (record.post_type === "job") return getJobDetail(record)?.job_category || record.category || "";
  if (record.post_type === "housing") return getHousingDetail(record)?.housing_type || record.category || "";
  if (record.post_type === "marketplace") return getMarketplaceDetail(record)?.item_category || record.category || "";
  return getServiceDetail(record)?.service_category || record.category || "";
}

export function getPostWorkType(record: PostRecord) {
  return record.post_type === "job" ? getJobDetail(record)?.employment_type ?? "" : "";
}

export function getPostSecondaryTag(record: PostCardView) {
  if (record.secondaryTag) return record.secondaryTag;
  if (record.type === "marketplace" || record.type === "service") return record.tag ?? "";
  return "";
}

export function getPostPriceValue(record: PostRecord) {
  if (record.post_type === "job") {
    const detail = getJobDetail(record);
    return numericOrUndefined(detail?.wage_min) ?? numericOrUndefined(detail?.wage_max);
  }
  if (record.post_type === "housing") {
    const detail = getHousingDetail(record);
    return numericOrUndefined(detail?.rent_amount) ?? numericOrUndefined(record.price_amount);
  }
  if (record.post_type === "marketplace") {
    const detail = getMarketplaceDetail(record);
    return numericOrUndefined(detail?.price_amount) ?? numericOrUndefined(record.price_amount);
  }
  return undefined;
}

export function getPostPriceDisplay(record: PostRecord, fallback = false) {
  if (record.post_type === "job") {
    const detail = getJobDetail(record);
    const salary = [numberText(detail?.wage_min), numberText(detail?.wage_max)].filter(Boolean).join("-");
    return salary ? `${salary}${wageUnitLabel(detail?.wage_unit)}` : fallback ? "薪资电议" : "";
  }

  if (record.post_type === "housing") {
    const detail = getHousingDetail(record);
    const price = numberText(detail?.rent_amount ?? record.price_amount);
    return price ? `$${price}` : fallback ? "价格面议" : "";
  }

  if (record.post_type === "marketplace") {
    const detail = getMarketplaceDetail(record);
    const price = numberText(detail?.price_amount ?? record.price_amount);
    return price ? `$${price}` : fallback ? "价格面议" : "";
  }

  return getServiceDetail(record)?.price_range || "";
}

export function getPostStatusText(record: PostRecord) {
  if (record.post_type === "marketplace" && getMarketplaceDetail(record)?.sold_at) return "已售";
  return "";
}

export function getPostLocationDisplay(record: PostRecord) {
  return getPostArea(record) || record.cities?.name || "";
}

export function getPostTag(record: PostRecord) {
  return getPostCategory(record) || postTypeFallbackLabel(record.post_type);
}

export function getPostHref(type: PostType, id: string) {
  return `${POST_TYPE_TO_ROUTE[type]}/${id}`;
}

export function getPostModeDisplay(record: PostRecord, variant: "full" | "short" = "full") {
  return postModeLabel(record.post_type, getPostMode(record), variant);
}

export function getPostSearchText(record: PostRecord) {
  const parts: Array<string | null | undefined> = [
    record.title,
    record.summary,
    record.body,
    record.category,
    record.subcategory,
    getPostArea(record),
    getPostCategory(record),
    getPostPriceDisplay(record),
  ];

  if (record.post_type === "job") {
    const detail = getJobDetail(record);
    parts.push(detail?.employment_type, detail?.employer_type);
  } else if (record.post_type === "marketplace") {
    parts.push(getMarketplaceDetail(record)?.condition);
  } else if (record.post_type === "service") {
    parts.push(getServiceDetail(record)?.service_status);
  }

  return parts.filter(Boolean).join(" ");
}
