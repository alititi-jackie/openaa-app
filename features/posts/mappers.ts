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
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function numberText(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

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
  if (unit === "year") return "/年";
  return unit ?? "";
}

function detailFields(record: PostRecord): Array<{ label: string; value: string }> {
  if (record.post_type === "job") {
    const detail = firstOrNull(record.post_details_jobs) as JobDetailRecord | null;
    const salary = [numberText(detail?.wage_min), numberText(detail?.wage_max)].filter(Boolean).join("-");
    return [
      { label: "类型", value: detail?.employment_type || "" },
      { label: "职位分类", value: detail?.job_category || "" },
      { label: "薪资", value: salary ? `${salary}${wageUnitLabel(detail?.wage_unit)}` : "" },
      { label: "区域", value: detail?.work_area || "" },
    ].filter((field) => field.value);
  }

  if (record.post_type === "housing") {
    const detail = firstOrNull(record.post_details_housing) as HousingDetailRecord | null;
    return [
      { label: "房型", value: detail?.housing_type || detail?.listing_type || "" },
      { label: "价格", value: detail?.rent_amount ? `$${numberText(detail.rent_amount)}` : "" },
      { label: "区域", value: detail?.address_area || "" },
    ].filter((field) => field.value);
  }

  if (record.post_type === "marketplace") {
    const detail = firstOrNull(record.post_details_marketplace) as MarketplaceDetailRecord | null;
    return [
      { label: "价格", value: detail?.price_amount ? `$${numberText(detail.price_amount)}` : record.price_amount ? `$${numberText(record.price_amount)}` : "" },
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

function detailMetaFields(record: PostRecord, card: PostCardView): Array<{ label: string; value: string }> {
  const published = record.published_at || record.created_at;
  const base = [
    { label: "发布者", value: card.authorName || "匿名用户" },
    { label: "浏览次数", value: `${card.viewCount || 0} 次浏览` },
    { label: "相对时间", value: published },
  ];

  if (record.post_type === "housing") {
    const detail = firstOrNull(record.post_details_housing) as HousingDetailRecord | null;
    return [
      ...base,
      { label: "地区", value: detail?.address_area || card.location || "" },
      { label: "出租/求租", value: detail?.listing_type || card.mode || "" },
      { label: "房型", value: detail?.housing_type || "" },
      { label: "价格", value: detail?.rent_amount ? `$${numberText(detail.rent_amount)}` : "" },
    ].filter((field) => field.value);
  }

  if (record.post_type === "marketplace") {
    const detail = firstOrNull(record.post_details_marketplace) as MarketplaceDetailRecord | null;
    return [
      ...base,
      { label: "出售/求购", value: detail?.listing_type || card.mode || "" },
      { label: "分类", value: detail?.item_category || card.tag || "" },
      { label: "价格", value: detail?.price_amount ? `$${numberText(detail.price_amount)}` : record.price_amount ? `$${numberText(record.price_amount)}` : "" },
      { label: "地区", value: detail?.trade_area || "" },
    ].filter((field) => field.value);
  }

  if (record.post_type === "service") {
    const detail = firstOrNull(record.post_details_services) as ServiceDetailRecord | null;
    return [
      ...base,
      { label: "地区", value: detail?.service_area || card.location || "" },
      { label: "服务分类", value: detail?.service_category || card.tag || "" },
    ].filter((field) => field.value);
  }

  return base.filter((field) => field.value);
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
    mode: record.subcategory,
    status: record.status,
    href: `${POST_TYPE_TO_ROUTE[record.post_type]}/${record.id}`,
    title: record.title,
    description: record.summary || record.body || "暂无摘要。",
    meta: publishedMeta(record),
    createdAt: record.created_at,
    tag: record.category || POST_TYPE_LABELS[record.post_type],
    location: cityName(record),
    authorName: author?.nickname || undefined,
    imageUrl: cover,
    favoriteCount: postStats.favorite_count ?? 0,
    viewCount: postStats.view_count ?? 0,
    fields: detailFields(record),
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
    detailMetaFields: detailMetaFields(record, card),
    contact,
  };
}
