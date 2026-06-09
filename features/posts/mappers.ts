import {
  getPostArea,
  getPostCategory,
  getPostCoverUrl,
  getPostHref,
  getPostImageViews,
  getPostLocationDisplay,
  getPostMode,
  getPostPriceDisplay,
  getPostPriceValue,
  getPostStatusText,
  getPostTag,
  getPostWorkType,
  postStats,
} from "./accessors";
import { postChannelConfig } from "./channelConfig";
import { buildDetailMetaPills } from "./detailMeta";
import type {
  AuthorSummary,
  PostCardView,
  PostDetailView,
  PostRecord,
} from "./types";

function publishedMeta(record: PostRecord) {
  const value = record.published_at || record.created_at;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "最新" : date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

function detailFields(record: PostRecord): Array<{ label: string; value: string }> {
  const config = postChannelConfig(record.post_type);
  return [
    { label: config.detailLabels.secondary ?? "分类", value: record.post_type === "job" ? getPostWorkType(record) : getPostCategory(record) },
    { label: config.detailLabels.category ?? "分类", value: record.post_type === "job" ? getPostCategory(record) : "" },
    { label: config.detailLabels.price ?? "价格", value: getPostPriceDisplay(record) },
    { label: record.post_type === "marketplace" ? "交易区域" : "区域", value: getPostArea(record) },
    { label: config.detailLabels.status ?? "状态", value: getPostStatusText(record) },
  ].filter((field) => field.value);
}

export function mapPostRecordToCard(record: PostRecord, authors: Record<string, AuthorSummary> = {}): PostCardView {
  const stats = postStats(record);
  const cover = getPostCoverUrl(record);
  const author = record.author_id ? authors[record.author_id] : null;
  const viewCount = stats.view_count ?? 0;
  const area = getPostArea(record);
  const category = getPostCategory(record);
  const priceValue = getPostPriceValue(record);
  const baseCard = {
    type: record.post_type,
    mode: getPostMode(record),
    status: record.status,
    href: getPostHref(record.post_type, record.id),
    tag: getPostTag(record),
    categoryValue: category,
    location: getPostLocationDisplay(record),
    area,
    priceDisplay: getPostPriceDisplay(record, record.post_type === "job" || record.post_type === "marketplace"),
    priceValue,
  };

  const secondaryTag =
    record.post_type === "job" ? getPostWorkType(record) : record.post_type === "housing" ? getPostCategory(record) : getPostTag(record);
  const card: PostCardView = {
    id: record.id,
    ...baseCard,
    title: record.title,
    description: record.summary || record.body || "暂无摘要。",
    meta: publishedMeta(record),
    createdAt: record.created_at,
    publishedAt: record.published_at,
    authorName: author?.nickname || undefined,
    imageUrl: cover,
    favoriteCount: stats.favorite_count ?? 0,
    viewCount,
    fields: detailFields(record),
    detailMetaFields: buildDetailMetaPills(record, author, viewCount, { includeImageIcon: Boolean(cover) }),
    secondaryTag,
  };
  return card;
}

export function mapPostRecordToDetail(record: PostRecord, authors: Record<string, AuthorSummary> = {}): PostDetailView {
  const card = mapPostRecordToCard(record, authors);
  const contact = Array.isArray(record.post_contacts) ? (record.post_contacts[0] ?? null) : record.post_contacts ?? null;
  const author = record.author_id ? authors[record.author_id] : null;

  return {
    ...card,
    body: record.body || record.summary || "暂无正文。",
    status: record.status,
    publishedAt: record.published_at,
    createdAt: record.created_at,
    images: getPostImageViews(record),
    detailMetaFields: buildDetailMetaPills(record, author, card.viewCount || 0),
    contact,
    sourceRecord: record,
  };
}
