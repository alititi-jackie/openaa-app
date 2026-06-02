import "server-only";

import { hasAdminPermission } from "@/lib/permissions/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { POST_TYPE_LABELS, POST_TYPE_TO_ROUTE } from "./constants";
import type { PostStatus, PostType, QueryState } from "./types";

export type AdminPostsPermissions = {
  viewPosts: boolean;
  moderatePosts: boolean;
  approvePosts: boolean;
  rejectPosts: boolean;
  hidePosts: boolean;
  restorePosts: boolean;
  deletePosts: boolean;
};

export type AdminPostListItem = {
  id: string;
  type: PostType;
  typeLabel: string;
  status: PostStatus;
  title: string;
  summary: string;
  category: string | null;
  visibility: string;
  authorId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  href: string;
};

type AdminPostsResult = {
  state: QueryState;
  permissions: AdminPostsPermissions;
  posts: AdminPostListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  pageCount: number;
  error?: string;
};

type AdminPostRecord = {
  id: string;
  post_type: PostType;
  author_id: string | null;
  title: string;
  summary: string | null;
  body: string | null;
  category: string | null;
  status: PostStatus;
  visibility: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminPostsParams = {
  type?: PostType | "all";
  status?: PostStatus | "all";
  q?: string;
  authorId?: string;
  page?: number;
};

const ADMIN_POSTS_PAGE_SIZE = 20;

export async function getAdminPostsPermissions(): Promise<AdminPostsPermissions> {
  const [viewPosts, moderatePosts, approvePosts, rejectPosts, hidePosts, restorePosts, deletePosts] = await Promise.all([
    hasAdminPermission("view_posts"),
    hasAdminPermission("moderate_posts"),
    hasAdminPermission("approve_posts"),
    hasAdminPermission("reject_posts"),
    hasAdminPermission("hide_posts"),
    hasAdminPermission("restore_posts"),
    hasAdminPermission("delete_posts"),
  ]);

  return { viewPosts, moderatePosts, approvePosts, rejectPosts, hidePosts, restorePosts, deletePosts };
}

export async function getAdminPostsData(params: AdminPostsParams = {}): Promise<AdminPostsResult> {
  const supabase = await createSupabaseServerClient();
  const permissions = await getAdminPostsPermissions();
  const page = normalizePage(params.page);
  const from = (page - 1) * ADMIN_POSTS_PAGE_SIZE;
  const to = from + ADMIN_POSTS_PAGE_SIZE - 1;

  if (!supabase) {
    return emptyResult("missing_config", permissions, page);
  }

  const canRead = permissions.viewPosts || permissions.moderatePosts;
  if (!canRead) {
    return emptyResult("ready", permissions, page);
  }

  let query = supabase
    .from("posts")
    .select("id,post_type,author_id,title,summary,body,category,status,visibility,published_at,created_at,updated_at", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (params.type && params.type !== "all") {
    query = query.eq("post_type", params.type);
  }

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  if (params.authorId && isUuid(params.authorId)) {
    query = query.eq("author_id", params.authorId);
  }

  if (params.q) {
    const keyword = sanitizeSearchTerm(params.q);
    if (keyword) {
      query = query.or(`title.ilike.%${keyword}%,summary.ilike.%${keyword}%`);
    }
  }

  const { data, error, count } = await query;
  if (error) {
    return { ...emptyResult("error", permissions, page), error: "后台帖子读取失败，请稍后再试。" };
  }

  const totalCount = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / ADMIN_POSTS_PAGE_SIZE));

  return {
    state: "ready",
    permissions,
    page,
    pageSize: ADMIN_POSTS_PAGE_SIZE,
    totalCount,
    pageCount,
    posts: ((data ?? []) as AdminPostRecord[]).map(mapAdminPost),
  };
}

function emptyResult(state: QueryState, permissions: AdminPostsPermissions, page: number): AdminPostsResult {
  return { state, permissions, posts: [], page, pageSize: ADMIN_POSTS_PAGE_SIZE, totalCount: 0, pageCount: 1 };
}

function normalizePage(value?: number) {
  if (!value || !Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

function sanitizeSearchTerm(value: string) {
  return value.trim().replace(/[%_,]/g, "").slice(0, 80);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function mapAdminPost(record: AdminPostRecord): AdminPostListItem {
  return {
    id: record.id,
    type: record.post_type,
    typeLabel: POST_TYPE_LABELS[record.post_type],
    status: record.status,
    title: record.title,
    summary: record.summary || record.body || "暂无摘要。",
    category: record.category,
    visibility: record.visibility,
    authorId: record.author_id,
    publishedAt: record.published_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    href: `${POST_TYPE_TO_ROUTE[record.post_type]}/${record.id}`,
  };
}
