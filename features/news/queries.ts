import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasAdminPermission } from "@/lib/permissions/admin";
import { ADMIN_NEWS_LIMIT, PUBLIC_NEWS_LIMIT } from "./constants";
import { fallbackNewsCategories, mapNewsCategory, mapNewsPostToAdmin, mapNewsPostToCard, mapNewsPostToDetail, sortPinnedFirst } from "./mappers";
import type { AdminNewsPermissions, AdminNewsPost, NewsCategory, NewsCategoryRecord, NewsDetailContext, NewsListParams, NewsPostCard, NewsPostDetail, NewsPostRecord, NewsQueryResult, NewsStatus } from "./types";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

const newsPostSelect = `
  id,
  category_id,
  author_id,
  title,
  slug,
  excerpt,
  body,
  cover_image_asset_id,
  status,
  is_featured,
  is_pinned,
  pinned_order,
  pinned_until,
  published_at,
  seo_title,
  seo_description,
  metadata,
  created_at,
  updated_at,
  news_categories(id,slug,name,description,sort_order,is_active),
  image_assets(source_type,public_url,external_url)
`;

const newsPostCategoryInnerSelect = newsPostSelect.replace("news_categories(id,slug,name,description,sort_order,is_active)", "news_categories!inner(id,slug,name,description,sort_order,is_active)");

function missingConfig<T>(data: T): NewsQueryResult<T> {
  return { state: "missing_config", data };
}

function errorResult<T>(data: T, error: unknown): NewsQueryResult<T> {
  const message = error instanceof Error ? error.message : String(error);
  return { state: "error", data, error: message };
}

export async function getNewsCategories(): Promise<NewsQueryResult<NewsCategory[]>> {
  const supabase = await createSupabaseServerClient();
  const fallback = fallbackNewsCategories();

  if (!supabase) return missingConfig(fallback);

  try {
    const { data, error } = await supabase
      .from("news_categories")
      .select("id,slug,name,description,sort_order,is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) return errorResult(fallback, error.message);
    const categories = ((data ?? []) as NewsCategoryRecord[]).map(mapNewsCategory);
    return { state: "ready", data: categories.length > 0 ? categories : fallback };
  } catch (error) {
    return errorResult(fallback, error);
  }
}

export async function getPublishedNewsList(params: NewsListParams = {}): Promise<NewsQueryResult<NewsPostCard[]>> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return missingConfig([]);

  try {
    const now = new Date().toISOString();
    let query = supabase
      .from("news_posts")
      .select(params.categorySlug ? newsPostCategoryInnerSelect : newsPostSelect)
      .eq("status", "published")
      .or(`published_at.is.null,published_at.lte.${now}`)
      .order("is_pinned", { ascending: false })
      .order("pinned_order", { ascending: true })
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(params.limit ?? PUBLIC_NEWS_LIMIT);

    if (params.categorySlug) {
      query = query.eq("news_categories.slug", params.categorySlug);
    }

    const { data, error } = await query;
    if (error) return errorResult([], error.message);

    return { state: "ready", data: sortPinnedFirst(((data ?? []) as unknown as NewsPostRecord[]).map(mapNewsPostToCard)) };
  } catch (error) {
    return errorResult([], error);
  }
}

function sanitizeSearchTerm(value: string) {
  return value.trim().replace(/[%,()]/g, " ").replace(/\s+/g, " ").slice(0, 80);
}

function normalizeSearchLimit(value?: number) {
  if (!value || !Number.isFinite(value)) return PUBLIC_NEWS_LIMIT;
  return Math.min(50, Math.max(1, Math.floor(value)));
}

export async function searchPublishedNews(params: { q?: string; limit?: number } = {}): Promise<NewsQueryResult<NewsPostCard[]>> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return missingConfig([]);

  const q = sanitizeSearchTerm(params.q ?? "");
  if (!q) return { state: "ready", data: [] };

  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("news_posts")
      .select(newsPostSelect)
      .eq("status", "published")
      .or(`published_at.is.null,published_at.lte.${now}`)
      .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,body.ilike.%${q}%`)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(normalizeSearchLimit(params.limit));

    if (error) return errorResult([], error.message);

    return { state: "ready", data: ((data ?? []) as unknown as NewsPostRecord[]).map(mapNewsPostToCard) };
  } catch (error) {
    return errorResult([], error);
  }
}

export async function getPinnedNews(limit = 3): Promise<NewsQueryResult<NewsPostCard[]>> {
  const list = await getPublishedNewsList({ limit: Math.max(limit * 2, limit) });
  return { ...list, data: list.data.filter((post) => post.isPinned).slice(0, limit) };
}

export async function getLatestNews(limit = 4): Promise<NewsQueryResult<NewsPostCard[]>> {
  const list = await getPublishedNewsList({ limit });
  return { ...list, data: list.data.slice(0, limit) };
}

export async function getNewsBySlug(slug: string): Promise<NewsQueryResult<NewsPostDetail | null>> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return missingConfig(null);

  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("news_posts")
      .select(newsPostSelect)
      .eq("slug", slug)
      .eq("status", "published")
      .or(`published_at.is.null,published_at.lte.${now}`)
      .maybeSingle();

    if (error) return errorResult(null, error.message);
    return { state: "ready", data: data ? mapNewsPostToDetail(data as unknown as NewsPostRecord) : null };
  } catch (error) {
    return errorResult(null, error);
  }
}

async function getPublishedNewsCards(params: NewsListParams = {}): Promise<NewsQueryResult<NewsPostCard[]>> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return missingConfig([]);

  try {
    const now = new Date().toISOString();
    let query = supabase
      .from("news_posts")
      .select(params.categorySlug ? newsPostCategoryInnerSelect : newsPostSelect)
      .eq("status", "published")
      .or(`published_at.is.null,published_at.lte.${now}`)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(params.limit ?? PUBLIC_NEWS_LIMIT);

    if (params.categorySlug) {
      query = query.eq("news_categories.slug", params.categorySlug);
    }

    const { data, error } = await query;
    if (error) return errorResult([], error.message);

    return { state: "ready", data: ((data ?? []) as unknown as NewsPostRecord[]).map(mapNewsPostToCard) };
  } catch (error) {
    return errorResult([], error);
  }
}

export async function getNewsDetailContext(slug: string): Promise<NewsQueryResult<NewsDetailContext | null>> {
  const postResult = await getNewsBySlug(slug);
  const post = postResult.data;

  if (!post) {
    return { state: postResult.state, data: null, error: postResult.error };
  }

  const emptySameCategoryResult: NewsQueryResult<NewsPostCard[]> = { state: "ready", data: [] };
  const [orderedResult, sameCategoryResult] = await Promise.all([
    getPublishedNewsCards({ limit: 100 }),
    post.categorySlug ? getPublishedNewsCards({ categorySlug: post.categorySlug, limit: 4 }) : Promise.resolve(emptySameCategoryResult),
  ]);

  const orderedPosts = orderedResult.data;
  const currentIndex = orderedPosts.findIndex((item) => item.slug === slug);
  const previousPost = currentIndex > 0 ? orderedPosts[currentIndex - 1] ?? null : null;
  const nextPost = currentIndex >= 0 ? orderedPosts[currentIndex + 1] ?? null : null;

  const relatedPosts = sameCategoryResult.data.filter((item) => item.slug !== slug).slice(0, 3);

  if (relatedPosts.length < 3) {
    const relatedSlugs = new Set(relatedPosts.map((item) => item.slug));
    relatedPosts.push(
      ...orderedPosts
        .filter((item) => item.slug !== slug && !relatedSlugs.has(item.slug))
        .slice(0, 3 - relatedPosts.length),
    );
  }

  const state = postResult.state === "error" || orderedResult.state === "error" || sameCategoryResult.state === "error" ? "error" : postResult.state;
  const error = postResult.error ?? orderedResult.error ?? sameCategoryResult.error;

  return {
    state,
    data: {
      post,
      previousPost,
      nextPost,
      relatedPosts,
    },
    error,
  };
}

export async function getAdminNewsPermissions(): Promise<AdminNewsPermissions> {
  const [viewNews, createNews, editNews, publishNews, deleteNews, manageNewsCategories] = await Promise.all([
    hasAdminPermission("view_news"),
    hasAdminPermission("create_news"),
    hasAdminPermission("edit_news"),
    hasAdminPermission("publish_news"),
    hasAdminPermission("delete_news"),
    hasAdminPermission("manage_news_categories"),
  ]);

  return { viewNews, createNews, editNews, publishNews, deleteNews, manageNewsCategories };
}

export async function getAdminNewsData(params: { status?: NewsStatus | "all"; categoryId?: string; q?: string } = {}) {
  const supabase = await createSupabaseServerClient();
  const permissions = await getAdminNewsPermissions();
  const categoriesFallback = fallbackNewsCategories();

  if (!supabase) {
    return { state: "missing_config" as const, permissions, categories: categoriesFallback, posts: [] as AdminNewsPost[] };
  }

  const canRead = permissions.viewNews || permissions.createNews || permissions.editNews || permissions.publishNews || permissions.deleteNews;
  if (!canRead) {
    return { state: "ready" as const, permissions, categories: categoriesFallback, posts: [] as AdminNewsPost[] };
  }

  const [categories, posts] = await Promise.all([readAdminCategories(supabase), readAdminPosts(supabase, params)]);

  return {
    state: categories.state === "error" || posts.state === "error" ? ("error" as const) : ("ready" as const),
    permissions,
    categories: categories.data.length > 0 ? categories.data : categoriesFallback,
    posts: posts.data,
    error: categories.error ?? posts.error,
  };
}

async function readAdminCategories(supabase: SupabaseServerClient): Promise<NewsQueryResult<NewsCategory[]>> {
  const { data, error } = await supabase
    .from("news_categories")
    .select("id,slug,name,description,sort_order,is_active")
    .order("sort_order", { ascending: true });

  if (error) return errorResult([], error.message);
  return { state: "ready", data: ((data ?? []) as NewsCategoryRecord[]).map(mapNewsCategory) };
}

async function readAdminPosts(supabase: SupabaseServerClient, params: { status?: NewsStatus | "all"; categoryId?: string; q?: string }): Promise<NewsQueryResult<AdminNewsPost[]>> {
  let query = supabase
    .from("news_posts")
    .select(newsPostSelect)
    .order("is_pinned", { ascending: false })
    .order("pinned_order", { ascending: true })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(ADMIN_NEWS_LIMIT);

  if (params.status && params.status !== "all") query = query.eq("status", params.status);
  if (params.categoryId) query = query.eq("category_id", params.categoryId);
  if (params.q) query = query.or(`title.ilike.%${params.q}%,slug.ilike.%${params.q}%`);

  const { data, error } = await query;
  if (error) return errorResult([], error.message);
  return { state: "ready", data: ((data ?? []) as unknown as NewsPostRecord[]).map(mapNewsPostToAdmin) };
}
