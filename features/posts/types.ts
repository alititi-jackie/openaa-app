export type PostType = "job" | "housing" | "marketplace" | "service";

export type PostStatus = "draft" | "pending_review" | "published" | "hidden" | "rejected" | "expired" | "deleted";

export type PostVisibility = "public" | "private";

export type QueryState = "ready" | "missing_config" | "error";

export type PostImageRecord = {
  id: string;
  sort_order: number | null;
  is_cover: boolean | null;
  caption: string | null;
  image_assets?: {
    public_url: string | null;
    external_url: string | null;
  } | null;
};

export type PostStatsRecord = {
  view_count: number | null;
  favorite_count: number | null;
};

export type JobDetailRecord = {
  employment_type: string | null;
  wage_min: number | string | null;
  wage_max: number | string | null;
  wage_unit: string | null;
  work_area: string | null;
  job_category: string | null;
};

export type HousingDetailRecord = {
  listing_type: string | null;
  housing_type: string | null;
  rent_amount: number | string | null;
  lease_term: string | null;
  address_area: string | null;
};

export type MarketplaceDetailRecord = {
  listing_type: string | null;
  item_category: string | null;
  condition: string | null;
  price_amount: number | string | null;
  negotiable: boolean | null;
  trade_area: string | null;
  sold_at: string | null;
};

export type ServiceDetailRecord = {
  service_category: string | null;
  service_area: string | null;
  price_range: string | null;
  service_status: string | null;
};

export type PostRecord = {
  id: string;
  post_type: PostType;
  author_id: string | null;
  title: string;
  summary: string | null;
  body: string | null;
  category: string | null;
  subcategory: string | null;
  status: PostStatus;
  visibility: PostVisibility;
  price_amount: number | string | null;
  currency: string | null;
  metadata: Record<string, unknown> | null;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  cities?: { name: string | null; slug: string | null } | null;
  post_stats?: PostStatsRecord[] | PostStatsRecord | null;
  post_images?: PostImageRecord[] | null;
  post_details_jobs?: JobDetailRecord[] | JobDetailRecord | null;
  post_details_housing?: HousingDetailRecord[] | HousingDetailRecord | null;
  post_details_marketplace?: MarketplaceDetailRecord[] | MarketplaceDetailRecord | null;
  post_details_services?: ServiceDetailRecord[] | ServiceDetailRecord | null;
};

export type AuthorSummary = {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
};

export type PostCardView = {
  id: string;
  type: PostType;
  status?: PostStatus;
  href: string;
  title: string;
  description: string;
  meta: string;
  tag?: string;
  location?: string;
  authorName?: string;
  imageUrl?: string;
  favoriteCount: number;
  viewCount: number;
  fields: Array<{ label: string; value: string }>;
};

export type PostDetailView = PostCardView & {
  body: string;
  status: PostStatus;
  publishedAt: string | null;
  createdAt: string;
  images: Array<{ url: string; caption?: string | null }>;
};

export type PostsQueryResult<T> = {
  state: QueryState;
  data: T;
  error?: string;
};

export type PublicPostsParams = {
  type: PostType;
  limit?: number;
};

export type ContactReveal = {
  contact_name: string | null;
  phone: string | null;
  wechat: string | null;
  email: string | null;
  preferred_contact_method: string | null;
};
