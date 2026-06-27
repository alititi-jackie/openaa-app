import type { SupabaseClient } from "@supabase/supabase-js";

export type PostType = "job" | "housing" | "marketplace" | "service";

export type PostStatus = "draft" | "pending_review" | "published" | "hidden" | "rejected" | "expired" | "deleted";

export type PostVisibility = "public" | "private";

export type QueryState = "ready" | "missing_config" | "error";

export type PostImageRecord = {
  id: string;
  image_asset_id?: string | null;
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
  experience_requirement?: string | null;
  language_requirement?: string | null;
  includes_meals?: boolean | null;
  includes_housing?: boolean | null;
  requires_work_authorization?: boolean | null;
  employer_type?: string | null;
};

export type HousingDetailRecord = {
  listing_type: string | null;
  housing_type: string | null;
  rent_amount: number | string | null;
  deposit_amount?: number | string | null;
  available_date?: string | null;
  lease_term: string | null;
  pets_allowed?: boolean | null;
  utilities_included?: boolean | null;
  transit_nearby?: string | null;
  address_area: string | null;
};

export type MarketplaceDetailRecord = {
  listing_type: string | null;
  item_category: string | null;
  condition: string | null;
  price_amount: number | string | null;
  negotiable: boolean | null;
  trade_area: string | null;
  delivery_options?: string[] | null;
  sold_at: string | null;
};

export type ServiceDetailRecord = {
  service_category: string | null;
  service_area: string | null;
  business_hours?: { text?: string } | Record<string, unknown> | null;
  price_range: string | null;
  service_status: string | null;
};

export type PostContactRecord = {
  contact_name: string | null;
  phone: string | null;
  wechat: string | null;
  email: string | null;
  preferred_contact_method: string | null;
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
  is_pinned?: boolean | null;
  pinned_order?: number | null;
  pinned_until?: string | null;
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
  post_contacts?: PostContactRecord[] | PostContactRecord | null;
};

export type AuthorSummary = {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
};

export type PostListingMetaField = {
  key?: string;
  group?: "common" | "business";
  label: string;
  tone?: "blue" | "orange" | "gray" | "service";
  value: string;
};

export type PostCardView = {
  id: string;
  type: PostType;
  mode?: string | null;
  status?: PostStatus;
  href: string;
  title: string;
  description: string;
  displayBody?: string;
  meta: string;
  createdAt?: string;
  publishedAt?: string | null;
  isPinned?: boolean;
  pinnedOrder?: number;
  pinnedUntil?: string | null;
  tag?: string;
  categoryValue?: string;
  location?: string;
  area?: string;
  priceDisplay?: string;
  priceValue?: number;
  footerLine?: string;
  secondaryTag?: string;
  authorName?: string;
  imageUrl?: string;
  favoriteCount: number;
  viewCount: number;
  fields: Array<{ label: string; value: string }>;
  detailMetaFields?: PostListingMetaField[];
  listingMetaFields?: PostListingMetaField[];
};

export type PostDetailView = PostCardView & {
  body: string;
  status: PostStatus;
  publishedAt: string | null;
  createdAt: string;
  images: Array<{ url: string; caption?: string | null; imageAssetId?: string | null }>;
  detailMetaFields: PostListingMetaField[];
  contact?: PostContactRecord | null;
  sourceRecord?: PostRecord;
};

export type PostDetailContext = {
  post: PostDetailView;
  previousPost: PostCardView | null;
  nextPost: PostCardView | null;
  relatedPosts: PostCardView[];
};

export type PostsQueryResult<T> = {
  state: QueryState;
  data: T;
  error?: string;
  pagination?: PostsPagination;
};

export type PostSort = "latest" | "oldest" | "price_asc" | "price_desc";

export type PublicPostFilters = {
  mode?: string;
  workType?: string;
  category?: string;
  q?: string;
  area?: string;
  min?: number;
  max?: number;
  sort: PostSort;
  page: number;
  pageSize: number;
};

export type PostsPagination = {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

export type PublicPostsParams = {
  type: PostType;
  limit?: number;
  showImageIndicator?: boolean;
  filters?: Partial<PublicPostFilters>;
  client?: SupabaseClient;
};

export type ContactReveal = PostContactRecord;
