import { POST_TYPE_LABELS, POST_TYPE_TO_ROUTE } from "./constants";
import type {
  AuthorSummary,
  HousingDetailRecord,
  JobDetailRecord,
  MarketplaceDetailRecord,
  PostCardView,
  PostDetailView,
  PostImageRecord,
  PostRecord,
  PostStatsRecord,
  ServiceDetailRecord,
} from "./types";

function firstOrNull<T>(value: T[] | T | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function numberText(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "";

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toLocaleString("en-US") : String(value);
}

function imageUrl(image: PostImageRecord | null) {
  return image?.image_assets?.public_url || image?.image_assets?.external_url || undefined;
}

function stats(record: PostRecord): PostStatsRecord {
  return firstOrNull(record.post_stats) ?? { favorite_count: 0, view_count: 0 };
}

function cityName(record: PostRecord) {
  return record.cities?.name || undefined;
}

function publishedMeta(record: PostRecord) {
  const value = record.published_at || record.created_at;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "最新" : date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

function wageUnitLabel(unit?: string | null) {
  if (unit === "hour") return "/小时";
  if (unit === "day") return "/天";
  if (unit === "week") return "/周";
  if (unit === "month") return "/月";
  return unit ?? "";
}

function moneyText(value: number | string | null | undefined) {
  const text = numberText(value);
  return text ? `$${text}` : "";
}

function listingBadge(value?: string | null) {
  if (!value) return "";
  if (value === "seeking" || value === "wanted") return "求租";
  if (value === "buying") return "求购";
  if (value === "selling") return "出售";
  if (value === "renting") return "出租";
  return value;
}

function detailFields(record: PostRecord): Array<{ label: string; value: string }> {
  if (record.post_type === "job") {
    const detail = firstOrNull(record.post_details_jobs) as JobDetailRecord | null;
    const salary = [numberText(detail?.wage_min), numberText(detail?.wage_max)].filter(Boolean).join("-");
    return [
      { label: "类型", value: detail?.employment_type || detail?.job_category || "" },
      { label: "薪资", value: salary ? `${salary}${wageUnitLabel(detail?.wage_unit)}` : "" },
      { label: "区域", value: detail?.work_area || "" },
    ].filter((field) => field.value);
  }

  if (record.post_type === "housing") {
    const detail = firstOrNull(record.post_details_housing) as HousingDetailRecord | null;
    return [
      { label: "房型", value: detail?.housing_type || detail?.listing_type || "" },
      { label: "价格", value: moneyText(detail?.rent_amount) },
      { label: "区域", value: detail?.address_area || "" },
    ].filter((field) => field.value);
  }

  if (record.post_type === "marketplace") {
    const detail = firstOrNull(record.post_details_marketplace) as MarketplaceDetailRecord | null;
    return [
      { label: "价格", value: moneyText(detail?.price_amount) || moneyText(record.price_amount) },
      { label: "成色", value: detail?.condition || "" },
      { label: "交易区域", value: detail?.trade_area || "" },
      { label: "状态", value: detail?.sold_at ? "已售" : "" },
    ].filter((field) => field.value);
  }

  const detail = firstOrNull(record.post_details_services) as ServiceDetailRecord | null;
  return [
    { label: "服务", value: detail?.service_category || "" },
    { label: "区域", value: detail?.service_area || "" },
    { label: "价格", value: detail?.price_range || "" },
  ].filter((field) => field.value);
}

function listDisplay(record: PostRecord) {
  if (record.post_type === "job") {
    const detail = firstOrNull(record.post_details_jobs) as JobDetailRecord | null;
    const salary = [numberText(detail?.wage_min), numberText(detail?.wage_max)].filter(Boolean).join("-");

    return {
      badge: detail?.employment_type || detail?.job_category || record.category || POST_TYPE_LABELS.job,
      salary: salary ? `${salary}${wageUnitLabel(detail?.wage_unit)}` : "",
      area: detail?.work_area || cityName(record) || "",
      category: detail?.job_category || record.category || "",
      companyName: typeof record.metadata?.company_name === "string" ? record.metadata.company_name : "",
      publishedLabel: publishedMeta(record),
    };
  }

  if (record.post_type === "housing") {
    const detail = firstOrNull(record.post_details_housing) as HousingDetailRecord | null;
    return {
      badge: listingBadge(detail?.listing_type) || record.category || "房源",
      secondaryBadge: detail?.housing_type || "",
      price: detail?.rent_amount ? `${moneyText(detail.rent_amount)} / 月` : "",
      area: detail?.address_area || cityName(record) || "",
      category: record.category || "",
      publishedLabel: publishedMeta(record),
    };
  }

  if (record.post_type === "marketplace") {
    const detail = firstOrNull(record.post_details_marketplace) as MarketplaceDetailRecord | null;
    const price = detail?.price_amount ?? record.price_amount;
    return {
      badge: listingBadge(detail?.listing_type) || record.category || "出售",
      price: price ? moneyText(price) : detail?.negotiable ? "面议" : "",
      area: detail?.trade_area || cityName(record) || "",
      category: detail?.item_category || record.category || "",
      publishedLabel: publishedMeta(record),
    };
  }

  const detail = firstOrNull(record.post_details_services) as ServiceDetailRecord | null;
  return {
    badge: detail?.service_category || record.category || POST_TYPE_LABELS.service,
    price: detail?.price_range || "",
    area: detail?.service_area || cityName(record) || "",
    category: detail?.service_category || record.category || "",
    publishedLabel: publishedMeta(record),
  };
}

export function mapPostRecordToCard(record: PostRecord, authors: Record<string, AuthorSummary> = {}): PostCardView {
  const postStats = stats(record);
  const cover = imageUrl(
    [...(record.post_images ?? [])].sort((a, b) => Number(Boolean(b.is_cover)) - Number(Boolean(a.is_cover)) || (a.sort_order ?? 0) - (b.sort_order ?? 0))[0] ?? null,
  );
  const author = record.author_id ? authors[record.author_id] : null;

  return {
    id: record.id,
    type: record.post_type,
    status: record.status,
    href: `${POST_TYPE_TO_ROUTE[record.post_type]}/${record.id}`,
    title: record.title,
    description: record.summary || record.body || "暂无摘要。",
    meta: publishedMeta(record),
    tag: record.category || POST_TYPE_LABELS[record.post_type],
    location: cityName(record),
    authorName: author?.nickname || undefined,
    imageUrl: cover,
    favoriteCount: postStats.favorite_count ?? 0,
    viewCount: postStats.view_count ?? 0,
    fields: detailFields(record),
    listDisplay: listDisplay(record),
  };
}

export function mapPostRecordToDetail(record: PostRecord, authors: Record<string, AuthorSummary> = {}): PostDetailView {
  const card = mapPostRecordToCard(record, authors);
  const images = (record.post_images ?? []).flatMap((image) => {
    const url = imageUrl(image);
    return url ? [{ url, caption: image.caption, imageAssetId: image.image_asset_id ?? null }] : [];
  });
  const contact = firstOrNull(record.post_contacts);

  return {
    ...card,
    body: record.body || record.summary || "暂无正文。",
    status: record.status,
    publishedAt: record.published_at,
    createdAt: record.created_at,
    images,
    contact,
  };
}
