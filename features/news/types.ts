export type NewsStatus = "draft" | "pending_review" | "published" | "hidden" | "rejected" | "expired" | "deleted";

export type NewsCategory = {
  id: string | null;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type NewsImageAsset = {
  public_url: string | null;
  external_url: string | null;
};

export type NewsCategoryRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type NewsPostRecord = {
  id: string;
  category_id: string | null;
  author_id: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  cover_image_asset_id: string | null;
  status: NewsStatus;
  is_featured: boolean;
  is_pinned: boolean;
  pinned_until?: string | null;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  news_categories?: NewsCategoryRecord | NewsCategoryRecord[] | null;
  image_assets?: NewsImageAsset | NewsImageAsset[] | null;
};

export type NewsPostCard = {
  id: string;
  title: string;
  slug: string;
  href: string;
  excerpt: string;
  categoryName: string;
  categorySlug: string | null;
  publishedAt: string | null;
  updatedAt: string;
  coverImageUrl: string | null;
  isFeatured: boolean;
  isPinned: boolean;
  pinnedUntil: string | null;
};

export type NewsPostDetail = NewsPostCard & {
  body: string;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type AdminNewsPost = NewsPostDetail & {
  status: NewsStatus;
  categoryId: string | null;
  coverImageAssetId: string | null;
  createdAt: string;
};

export type NewsQueryResult<T> = {
  state: "ready" | "missing_config" | "error";
  data: T;
  error?: string;
};

export type NewsListParams = {
  categorySlug?: string;
  limit?: number;
};

export type AdminNewsPermissions = {
  viewNews: boolean;
  createNews: boolean;
  editNews: boolean;
  publishNews: boolean;
  deleteNews: boolean;
  manageNewsCategories: boolean;
};
