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
  getHousingAmountTimeDisplay,
  isPostEffectivelyPinned,
  postStats,
} from "./accessors";
import { postChannelConfig } from "./channelConfig";
import { buildDetailMetaPills, buildHousingAmountTimeMetaPill } from "./detailMeta";
import { buildPostDisplayBody, formatLocationLabel, formatPostAuthorName, formatPostCategoryLabel, formatPostTime } from "./display";
import type {
  AuthorSummary,
  PostCardView,
  PostDetailView,
  PostRecord,
} from "./types";

type MapPostRecordOptions = {
  showImageIndicator?: boolean;
};

function publishedMeta(record: PostRecord) {
  return formatPostTime(record.published_at || record.created_at, "shortDate");
}

function detailFields(record: PostRecord): Array<{ label: string; value: string }> {
  const config = postChannelConfig(record.post_type);
  return [
    {
      label: config.detailLabels.secondary ?? "分类",
      value: record.post_type === "job" ? getPostWorkType(record) : formatPostCategoryLabel(record.post_type, getPostCategory(record)),
    },
    { label: config.detailLabels.category ?? "分类", value: record.post_type === "job" ? formatPostCategoryLabel(record.post_type, getPostCategory(record)) : "" },
    { label: config.detailLabels.price ?? "价格", value: record.post_type === "housing" ? "" : getPostPriceDisplay(record) },
    { label: record.post_type === "marketplace" ? "交易区域" : "区域", value: formatLocationLabel(getPostArea(record)) },
    { label: config.detailLabels.status ?? "状态", value: getPostStatusText(record) },
  ].filter((field) => field.value);
}

function cardDetailMetaFields(record: PostRecord, author?: AuthorSummary | null, viewCount = 0, showImageIndicator = false) {
  const fields = buildDetailMetaPills(record, author, viewCount, { showImageIndicator });
  const housingAmountTime = record.post_type === "housing" ? buildHousingAmountTimeMetaPill(record) : null;
  return housingAmountTime ? [...fields, housingAmountTime] : fields;
}

function listingMetaFields(record: PostRecord, author?: AuthorSummary | null, viewCount = 0) {
  return buildDetailMetaPills(record, author, viewCount);
}

export function mapPostRecordToCard(record: PostRecord, authors: Record<string, AuthorSummary> = {}, options: MapPostRecordOptions = {}): PostCardView {
  const stats = postStats(record);
  const cover = getPostCoverUrl(record);
  const author = record.author_id ? authors[record.author_id] : null;
  const viewCount = stats.view_count ?? 0;
  const displayBody = buildPostDisplayBody(record);
  const area = getPostArea(record);
  const category = getPostCategory(record);
  const priceValue = getPostPriceValue(record);
  const isPinned = isPostEffectivelyPinned(record);
  const baseCard = {
    type: record.post_type,
    mode: getPostMode(record),
    status: record.status,
    href: getPostHref(record.post_type, record.id),
    tag: getPostTag(record),
    categoryValue: formatPostCategoryLabel(record.post_type, category),
    location: getPostLocationDisplay(record),
    area: formatLocationLabel(area),
    priceDisplay: getPostPriceDisplay(record, record.post_type === "job" || record.post_type === "marketplace"),
    priceValue,
    footerLine: getHousingAmountTimeDisplay(record),
  };

  const secondaryTag =
    record.post_type === "job" ? getPostWorkType(record) : record.post_type === "housing" ? getPostCategory(record) : getPostTag(record);
  const card: PostCardView = {
    id: record.id,
    ...baseCard,
    title: record.title,
    description: record.summary || record.body || "暂无摘要。",
    displayBody,
    meta: publishedMeta(record),
    createdAt: record.created_at,
    publishedAt: record.published_at,
    isPinned,
    pinnedOrder: record.pinned_order ?? 0,
    pinnedUntil: record.pinned_until ?? null,
    authorName: formatPostAuthorName(author),
    imageUrl: cover,
    favoriteCount: stats.favorite_count ?? 0,
    viewCount,
    fields: detailFields(record),
    detailMetaFields: cardDetailMetaFields(record, author, viewCount, Boolean(options.showImageIndicator && record.post_type === "housing" && cover)),
    listingMetaFields: listingMetaFields(record, author, viewCount),
    secondaryTag,
  };
  return card;
}

export function mapPostRecordToDetail(record: PostRecord, authors: Record<string, AuthorSummary> = {}, options: MapPostRecordOptions = {}): PostDetailView {
  const card = mapPostRecordToCard(record, authors, options);
  const contact = Array.isArray(record.post_contacts) ? (record.post_contacts[0] ?? null) : record.post_contacts ?? null;
  const author = record.author_id ? authors[record.author_id] : null;
  const userImages = getPostImageViews(record);

  return {
    ...card,
    body: card.displayBody || buildPostDisplayBody(record),
    status: record.status,
    publishedAt: record.published_at,
    createdAt: record.created_at,
    images: userImages,
    detailMetaFields: buildDetailMetaPills(record, author, card.viewCount || 0),
    contact,
    sourceRecord: record,
  };
}
