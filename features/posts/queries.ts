import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_CITY_SLUG, DEFAULT_POST_LIMIT, PUBLIC_POST_TYPES } from "./constants";
import { applyPublicPostFilters, normalizePublicPostFilters } from "./filters";
import { mapPostRecordToCard, mapPostRecordToDetail } from "./mappers";
import type {
  AuthorSummary,
  ContactReveal,
  PostCardView,
  PostDetailView,
  PostRecord,
  PostType,
  PostsQueryResult,
  PublicPostsParams,
} from "./types";

const MAX_PUBLIC_FILTER_ROWS = 1000;
const MAX_PUBLIC_SEARCH_CANDIDATE_ROWS = 200;

const postSelectFields = `
  id,
  post_type,
  author_id,
  title,
  summary,
  body,
  category,
  subcategory,
  status,
  visibility,
  price_amount,
  currency,
  metadata,
  published_at,
  expires_at,
  created_at,
  updated_at,
  post_stats(view_count, favorite_count),
  post_images(
    id,
    image_asset_id,
    sort_order,
    is_cover,
    caption,
    image_assets(public_url, external_url)
  ),
  post_details_jobs(employment_type, wage_min, wage_max, wage_unit, job_category, work_area, experience_requirement, language_requirement, includes_meals, includes_housing, requires_work_authorization, employer_type),
  post_details_housing(listing_type, housing_type, rent_amount, deposit_amount, available_date, lease_term, pets_allowed, utilities_included, transit_nearby, address_area),
  post_details_marketplace(listing_type, item_category, condition, price_amount, negotiable, trade_area, delivery_options, sold_at),
  post_details_services(service_category, service_area, business_hours, price_range, service_status)
`;

const publicPostSelect = `
  ${postSelectFields},
  cities!inner(name, slug)
`;

const ownPostSelect = `
  ${postSelectFields},
  cities(name, slug)
`;

function warnMissingSupabase() {
  if (process.env.NODE_ENV !== "production") {
    console.warn("Supabase public environment variables are not configured; returning empty posts.");
  }
}

function emptyResult<T>(data: T): PostsQueryResult<T> {
  warnMissingSupabase();
  return { state: "missing_config", data };
}

function queryError<T>(scope: string, error: { message?: string } | null | undefined, data: T): PostsQueryResult<T> {
  console.error(`[posts] ${scope}`, error);
  return { state: "error", data, error: "内容读取失败，请稍后再试。" };
}

async function fetchAuthors(authorIds: Array<string | null | undefined>): Promise<Record<string, AuthorSummary>> {
  const ids = [...new Set(authorIds.filter((id): id is string => Boolean(id)))];

  if (ids.length === 0) {
    return {};
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {};
  }

  const { data } = await supabase.from("profiles").select("id,nickname,avatar_url").in("id", ids);

  return Object.fromEntries(
    ((data ?? []) as AuthorSummary[]).map((author) => [
      author.id,
      {
        id: author.id,
        nickname: author.nickname,
        avatar_url: author.avatar_url,
      },
    ]),
  );
}

export async function getPublicPosts(params: PublicPostsParams): Promise<PostsQueryResult<PostCardView[]>> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return emptyResult([]);
  }

  const normalizedFilters = normalizePublicPostFilters(params.filters);
  const filters = params.type === "service"
    ? { ...normalizedFilters, min: undefined, max: undefined, sort: normalizedFilters.sort === "oldest" ? ("oldest" as const) : ("latest" as const) }
    : normalizedFilters;
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("posts")
    .select(publicPostSelect)
    .eq("status", "published")
    .eq("visibility", "public")
    .eq("cities.slug", DEFAULT_CITY_SLUG)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .eq("post_type", params.type)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(params.limit ?? MAX_PUBLIC_FILTER_ROWS);

  if (error) return queryError("get public posts failed", error, []);

  const records = (data ?? []) as unknown as PostRecord[];
  const filteredRecords = applyPublicPostFilters(records, params.type, filters);
  const total = filteredRecords.length;
  const pageCount = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.page, pageCount);
  const start = (page - 1) * filters.pageSize;
  const pageRecords = filteredRecords.slice(start, start + filters.pageSize);
  const authors = await fetchAuthors(records.map((post) => post.author_id));

  return {
    state: "ready",
    data: pageRecords.map((record) => mapPostRecordToCard(record, authors, { showImageIndicator: params.showImageIndicator })),
    pagination: {
      page,
      pageSize: filters.pageSize,
      total,
      pageCount,
      hasPrevious: page > 1,
      hasNext: page < pageCount,
    },
  };
}

export async function searchPublicPosts(params: { q?: string; type?: PostType; limit?: number } = {}): Promise<PostsQueryResult<PostCardView[]>> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return emptyResult([]);
  }

  const keyword = sanitizeSearchTerm(params.q ?? "");
  if (!keyword) {
    return { state: "ready", data: [] };
  }

  const now = new Date().toISOString();
  let query = supabase
    .from("posts")
    .select(publicPostSelect)
    .eq("status", "published")
    .eq("visibility", "public")
    .eq("cities.slug", DEFAULT_CITY_SLUG)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(MAX_PUBLIC_SEARCH_CANDIDATE_ROWS);

  if (params.type) {
    query = query.eq("post_type", params.type);
  }

  const { data, error } = await query;

  if (error) return queryError("search public posts failed", error, []);

  const records = (data ?? []) as unknown as PostRecord[];
  const filteredRecords = records
    .filter((record) => applyPublicPostFilters([record], record.post_type, { ...normalizePublicPostFilters({ q: keyword }), pageSize: MAX_PUBLIC_FILTER_ROWS }).length > 0)
    .slice(0, normalizeSearchLimit(params.limit));
  const authors = await fetchAuthors(filteredRecords.map((post) => post.author_id));

  return { state: "ready", data: filteredRecords.map((record) => mapPostRecordToCard(record, authors)) };
}

export async function getPublicPostById(id: string, type: PostType): Promise<PostsQueryResult<PostDetailView | null>> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return emptyResult(null);
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("posts")
    .select(publicPostSelect)
    .eq("status", "published")
    .eq("visibility", "public")
    .eq("cities.slug", DEFAULT_CITY_SLUG)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .eq("id", id)
    .eq("post_type", type)
    .maybeSingle();

  if (error) return queryError("get public post by id failed", error, null);

  if (!data) {
    return { state: "ready", data: null };
  }

  const record = data as unknown as PostRecord;
  const authors = await fetchAuthors([record.author_id]);

  return { state: "ready", data: mapPostRecordToDetail(record, authors) };
}

export async function getLatestPosts(limitPerType = 3): Promise<PostsQueryResult<Record<PostType, PostCardView[]>>> {
  const empty: Record<PostType, PostCardView[]> = {
    job: [],
    housing: [],
    marketplace: [],
    service: [],
  };
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return emptyResult(empty);
  }

  const result = { ...empty };
  let sawError: string | undefined;

  for (const type of PUBLIC_POST_TYPES) {
    const posts = await getPublicPosts({ type, limit: limitPerType });
    result[type] = posts.data;
    sawError ||= posts.error;
  }

  return { state: sawError ? "error" : "ready", data: result, error: sawError };
}

export async function getUserPosts(userId: string, type?: PostType): Promise<PostsQueryResult<PostCardView[]>> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return emptyResult([]);
  }

  let query = supabase
    .from("posts")
    .select(ownPostSelect)
    .eq("author_id", userId)
    .order("updated_at", { ascending: false })
    .limit(30);

  if (type) {
    query = query.eq("post_type", type);
  }

  const { data, error } = await query;

  if (error) return queryError("get user posts failed", error, []);

  const records = (data ?? []) as unknown as PostRecord[];
  const authors = await fetchAuthors([userId]);

  return { state: "ready", data: records.map((record) => mapPostRecordToCard(record, authors)) };
}

export async function getMyPosts(type?: PostType): Promise<PostsQueryResult<PostCardView[]>> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return emptyResult([]);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { state: "ready", data: [] };
  }

  return getUserPosts(user.id, type);
}

function uniqueOrderedPostIds(rows: Array<{ post_id: string | null }>) {
  const seen = new Set<string>();
  const ids: string[] = [];

  for (const row of rows) {
    if (!row.post_id || seen.has(row.post_id)) continue;
    seen.add(row.post_id);
    ids.push(row.post_id);
  }

  return ids;
}

function sanitizeSearchTerm(value: string) {
  return value.trim().replace(/[%,()]/g, " ").replace(/\s+/g, " ").slice(0, 80);
}

function normalizeSearchLimit(value?: number) {
  if (!value || !Number.isFinite(value)) return DEFAULT_POST_LIMIT;
  return Math.min(50, Math.max(1, Math.floor(value)));
}

async function getPublicCardsByOrderedIds(ids: string[]): Promise<PostsQueryResult<PostCardView[]>> {
  if (ids.length === 0) {
    return { state: "ready", data: [] };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return emptyResult([]);
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("posts")
    .select(publicPostSelect)
    .in("id", ids)
    .eq("status", "published")
    .eq("visibility", "public")
    .eq("cities.slug", DEFAULT_CITY_SLUG)
    .or(`expires_at.is.null,expires_at.gt.${now}`);

  if (error) return queryError("get public cards by ordered ids failed", error, []);

  const records = (data ?? []) as unknown as PostRecord[];
  const authors = await fetchAuthors(records.map((post) => post.author_id));
  const cardsById = new Map(records.map((record) => [record.id, mapPostRecordToCard(record, authors)]));

  return { state: "ready", data: ids.flatMap((id) => cardsById.get(id) ?? []) };
}

export async function getMyFavoritePosts(): Promise<PostsQueryResult<PostCardView[]>> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return emptyResult([]);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { state: "ready", data: [] };
  }

  const { data, error } = await supabase
    .from("post_favorites")
    .select("post_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return queryError("get favorite post ids failed", error, []);

  return getPublicCardsByOrderedIds(uniqueOrderedPostIds((data ?? []) as Array<{ post_id: string | null }>));
}

export async function getMyRecentPosts(): Promise<PostsQueryResult<PostCardView[]>> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return emptyResult([]);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { state: "ready", data: [] };
  }

  const { data, error } = await supabase
    .from("post_views")
    .select("post_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) return queryError("get recent post ids failed", error, []);

  return getPublicCardsByOrderedIds(uniqueOrderedPostIds((data ?? []) as Array<{ post_id: string | null }>));
}

export async function getEditablePostById(id: string, type: PostType): Promise<PostsQueryResult<PostDetailView | null>> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return emptyResult(null);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { state: "ready", data: null };
  }

  const { data, error } = await supabase
    .from("posts")
    .select(
      `
        ${ownPostSelect},
        post_contacts(contact_name, phone, email, wechat, preferred_contact_method)
      `,
    )
    .eq("id", id)
    .eq("post_type", type)
    .eq("author_id", user.id)
    .maybeSingle();

  if (error) return queryError("get editable post by id failed", error, null);

  if (!data) {
    return { state: "ready", data: null };
  }

  const record = data as unknown as PostRecord;
  const authors = await fetchAuthors([user.id]);

  return { state: "ready", data: mapPostRecordToDetail(record, authors) };
}

export async function getPostContact(id: string): Promise<PostsQueryResult<ContactReveal | null>> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return emptyResult(null);
  }

  const now = new Date().toISOString();
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id,cities!inner(slug)")
    .eq("status", "published")
    .eq("visibility", "public")
    .eq("cities.slug", DEFAULT_CITY_SLUG)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .eq("id", id)
    .maybeSingle();

  if (postError) return queryError("get contact post visibility failed", postError, null);

  if (!post) {
    return { state: "ready", data: null, error: "该信息不存在或暂不可公开查看。" };
  }

  const { data, error } = await supabase
    .from("post_contacts")
    .select("contact_name,phone,wechat,email,preferred_contact_method")
    .eq("post_id", id)
    .maybeSingle();

  if (error) {
    if (error.code === "42501") {
      return { state: "ready", data: null, error: "联系方式暂不可公开查看。" };
    }

    return queryError("get post contact failed", error, null);
  }

  return { state: "ready", data: (data as ContactReveal | null) ?? null };
}
