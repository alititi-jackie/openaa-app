import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { favoriteCategory, favoriteKey, normalizeFavoriteType } from "./helpers";
import type { FavoriteListItem, FavoriteRecord, FavoriteTarget, FavoritesQueryResult } from "./types";

const DEFAULT_PAGE_SIZE = 20;

function missingConfig<T>(data: T): FavoritesQueryResult<T> {
  return { state: "missing_config", data };
}

function errorResult<T>(data: T, error: unknown): FavoritesQueryResult<T> {
  const message = error instanceof Error ? error.message : String(error);
  return { state: "error", data, error: message };
}

function normalizePage(value?: string | number | null) {
  const page = Number(value);
  return Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
}

function mapFavorite(row: FavoriteRecord, liveUrls: Set<string>): FavoriteListItem {
  const isDeleted = row.target_url.startsWith("/") && !liveUrls.has(row.target_url);

  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    targetUrl: row.target_url,
    title: isDeleted ? "内容已删除" : row.title,
    category: favoriteCategory(row.target_type, row.category),
    createdAt: row.created_at,
    isDeleted,
  };
}

export async function getFavoriteState(target: FavoriteTarget): Promise<boolean> {
  const states = await getFavoriteStates([target]);
  return states.has(favoriteKey(target));
}

export async function getFavoriteStates(targets: FavoriteTarget[]): Promise<Set<string>> {
  const supabase = await createSupabaseServerClient();
  if (!supabase || targets.length === 0) return new Set();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Set();

  const types = [...new Set(targets.map((target) => target.type))];
  const ids = [...new Set(targets.map((target) => target.id))];
  const requested = new Set(targets.map(favoriteKey));

  const { data } = await supabase
    .from("user_favorites")
    .select("target_type,target_id")
    .eq("user_id", user.id)
    .in("target_type", types)
    .in("target_id", ids);

  return new Set(
    ((data ?? []) as Array<{ target_type: string; target_id: string }>)
      .map((row) => `${row.target_type}:${row.target_id}`)
      .filter((key) => requested.has(key)),
  );
}

export async function getMyFavorites(params: { type?: string | null; page?: string | number | null; pageSize?: number } = {}): Promise<FavoritesQueryResult<FavoriteListItem[]>> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return missingConfig([]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { state: "ready", data: [] };

  const page = normalizePage(params.page);
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const type = normalizeFavoriteType(params.type);

  let query = supabase
    .from("user_favorites")
    .select("id,user_id,target_type,target_id,target_url,title,category,created_at", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (type !== "all") query = query.eq("target_type", type);

  const { data, error, count } = await query;
  if (error) return errorResult([], error.message);

  const rows = (data ?? []) as FavoriteRecord[];
  const liveUrls = await getLiveUrls(rows);
  const total = count ?? rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return {
    state: "ready",
    data: rows.map((row) => mapFavorite(row, liveUrls)),
    pagination: {
      page,
      pageSize,
      total,
      pageCount,
      hasPrevious: page > 1,
      hasNext: page < pageCount,
    },
  };
}

export async function getFavoriteCount(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return 0;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { count } = await supabase
    .from("user_favorites")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return count ?? 0;
}

async function getLiveUrls(rows: FavoriteRecord[]) {
  const liveUrls = new Set(rows.map((row) => row.target_url));
  const supabase = await createSupabaseServerClient();
  if (!supabase || rows.length === 0) return liveUrls;

  const postIds = rows.filter((row) => ["job", "housing", "marketplace", "service"].includes(row.target_type)).map((row) => row.target_id);
  const newsIds = rows.filter((row) => row.target_type === "news").map((row) => row.target_id);
  const navIds = rows.filter((row) => row.target_type === "navigation").map((row) => row.target_id);

  const [posts, news, navigation] = await Promise.all([
    postIds.length
      ? supabase.from("posts").select("id").in("id", postIds).eq("status", "published").eq("visibility", "public")
      : Promise.resolve({ data: [] }),
    newsIds.length
      ? supabase.from("news_posts").select("id").in("id", newsIds).eq("status", "published")
      : Promise.resolve({ data: [] }),
    navIds.length
      ? supabase.from("navigation_links").select("id").in("id", navIds).eq("is_active", true)
      : Promise.resolve({ data: [] }),
  ]);

  const livePostIds = new Set(((posts.data ?? []) as Array<{ id: string }>).map((row) => row.id));
  const liveNewsIds = new Set(((news.data ?? []) as Array<{ id: string }>).map((row) => row.id));
  const liveNavIds = new Set(((navigation.data ?? []) as Array<{ id: string }>).map((row) => row.id));

  for (const row of rows) {
    if (["job", "housing", "marketplace", "service"].includes(row.target_type) && !livePostIds.has(row.target_id)) liveUrls.delete(row.target_url);
    if (row.target_type === "news" && !liveNewsIds.has(row.target_id)) liveUrls.delete(row.target_url);
    if (row.target_type === "navigation" && !liveNavIds.has(row.target_id)) liveUrls.delete(row.target_url);
  }

  return liveUrls;
}
