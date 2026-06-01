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
};

const ADMIN_POSTS_LIMIT = 50;

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

  if (!supabase) {
    return { state: "missing_config", permissions, posts: [] };
  }

  const canRead = permissions.viewPosts || permissions.moderatePosts;
  if (!canRead) {
    return { state: "ready", permissions, posts: [] };
  }

  let query = supabase
    .from("posts")
    .select("id,post_type,author_id,title,summary,body,category,status,visibility,published_at,created_at,updated_at")
    .order("updated_at", { ascending: false })
    .limit(ADMIN_POSTS_LIMIT);

  if (params.type && params.type !== "all") {
    query = query.eq("post_type", params.type);
  }

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,summary.ilike.%${params.q}%`);
  }

  const { data, error } = await query;
  if (error) {
    return { state: "error", permissions, posts: [], error: "后台帖子读取失败，请稍后再试。" };
  }

  return {
    state: "ready",
    permissions,
    posts: ((data ?? []) as AdminPostRecord[]).map(mapAdminPost),
  };
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
