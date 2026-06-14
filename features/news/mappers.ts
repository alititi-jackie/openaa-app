import { DEFAULT_NEWS_CATEGORIES, NEWS_DEFAULT_DESCRIPTION } from "./constants";
import type { AdminNewsPost, NewsCategory, NewsCategoryRecord, NewsImageAsset, NewsPostCard, NewsPostDetail, NewsPostRecord } from "./types";

function firstOrNull<T>(value: T[] | T | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function fallbackNewsCategories(): NewsCategory[] {
  return DEFAULT_NEWS_CATEGORIES.map((category) => ({
    id: null,
    slug: category.slug,
    name: category.name,
    description: null,
    sortOrder: category.sort_order,
    isActive: true,
  }));
}

export function mapNewsCategory(record: NewsCategoryRecord): NewsCategory {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    description: record.description,
    sortOrder: record.sort_order,
    isActive: record.is_active,
  };
}

function categoryFor(record: NewsPostRecord) {
  const category = firstOrNull(record.news_categories);
  return {
    name: category?.name ?? "新闻",
    slug: category?.slug ?? null,
  };
}

function imageUrl(record: NewsPostRecord) {
  const asset = firstOrNull<NewsImageAsset>(record.image_assets);
  return asset?.external_url || asset?.public_url || null;
}

function imageSource(record: NewsPostRecord) {
  const asset = firstOrNull<NewsImageAsset>(record.image_assets);
  if (asset?.source_type === "storage" || asset?.source_type === "external") return asset.source_type;
  return null;
}

function excerptFor(record: NewsPostRecord) {
  return record.excerpt || record.body?.replace(/\s+/g, " ").trim().slice(0, 96) || NEWS_DEFAULT_DESCRIPTION;
}

function isEffectivePinned(record: Pick<NewsPostRecord, "is_pinned" | "pinned_until">) {
  if (!record.is_pinned) return false;
  if (!record.pinned_until) return true;
  const time = new Date(record.pinned_until).getTime();
  return Number.isFinite(time) && time > Date.now();
}

export function formatNewsDate(value: string | null) {
  if (!value) return "待发布";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function mapNewsPostToCard(record: NewsPostRecord): NewsPostCard {
  const category = categoryFor(record);

  return {
    id: record.id,
    title: record.title,
    slug: record.slug,
    href: `/news/${record.slug}`,
    excerpt: excerptFor(record),
    categoryName: category.name,
    categorySlug: category.slug,
    publishedAt: record.published_at,
    updatedAt: record.updated_at,
    coverImageUrl: imageUrl(record),
    coverImageSource: imageSource(record),
    isFeatured: record.is_featured,
    isPinned: isEffectivePinned(record),
    pinnedOrder: record.pinned_order ?? 0,
    pinnedUntil: record.pinned_until ?? null,
  };
}

export function mapNewsPostToDetail(record: NewsPostRecord): NewsPostDetail {
  return {
    ...mapNewsPostToCard(record),
    body: record.body || record.excerpt || "暂无正文。",
    seoTitle: record.seo_title,
    seoDescription: record.seo_description,
  };
}

export function mapNewsPostToAdmin(record: NewsPostRecord): AdminNewsPost {
  return {
    ...mapNewsPostToDetail(record),
    status: record.status,
    categoryId: record.category_id,
    coverImageAssetId: record.cover_image_asset_id,
    createdAt: record.created_at,
  };
}

export function sortPinnedFirst(posts: NewsPostCard[]) {
  return [...posts].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    if (a.isPinned && b.isPinned && a.pinnedOrder !== b.pinnedOrder) return a.pinnedOrder - b.pinnedOrder;
    const aTime = new Date(a.publishedAt ?? a.updatedAt).getTime();
    const bTime = new Date(b.publishedAt ?? b.updatedAt).getTime();
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  });
}
