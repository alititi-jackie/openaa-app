"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_CITY_SLUG, POST_TYPE_TO_ROUTE } from "./constants";
import { postHref } from "./formMappers";
import type { PostType } from "./types";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export type FavoriteActionResult = {
  ok: boolean;
  message: string;
  authRequired?: boolean;
  loginHref?: string;
  isFavorited?: boolean;
  favoriteCount?: number;
};

export type ReportActionResult = {
  ok: boolean;
  message: string;
  authRequired?: boolean;
  loginHref?: string;
  alreadyReported?: boolean;
};

export type ViewActionResult = {
  ok: boolean;
  message?: string;
  viewCount?: number;
};

type RecordPostViewRpcResult = number | { view_count?: number | null } | Array<{ view_count?: number | null }>;

const reportReasons = new Set(["false_information", "expired", "scam", "invalid_contact", "illegal", "other"]);

function loginHref(returnTo: string) {
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}

async function getPublicPost(supabase: SupabaseServerClient, postId: string) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("posts")
    .select("id,post_type,status,visibility,expires_at,cities!inner(slug)")
    .eq("id", postId)
    .eq("status", "published")
    .eq("visibility", "public")
    .eq("cities.slug", DEFAULT_CITY_SLUG)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as { id: string; post_type: PostType };
}

async function getFavoriteCount(supabase: SupabaseServerClient, postId: string) {
  const { data } = await supabase.from("post_stats").select("favorite_count").eq("post_id", postId).maybeSingle();
  return Number(data?.favorite_count ?? 0);
}

async function getViewCount(supabase: SupabaseServerClient, postId: string) {
  const { data } = await supabase.from("post_stats").select("view_count").eq("post_id", postId).maybeSingle();
  return Number(data?.view_count ?? 0);
}

function viewCountFromRpcResult(data: RecordPostViewRpcResult | null) {
  const value = Array.isArray(data) ? data[0]?.view_count : typeof data === "number" ? data : data?.view_count;
  const count = Number(value);
  return Number.isFinite(count) ? count : null;
}

function revalidatePost(type: PostType, postId: string) {
  revalidatePath(POST_TYPE_TO_ROUTE[type]);
  revalidatePath(postHref(type, postId));
}

export async function togglePostFavorite(postId: string, returnTo: string): Promise<FavoriteActionResult> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "Supabase 环境变量尚未配置，暂时无法收藏。" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "请先登录后再收藏。", authRequired: true, loginHref: loginHref(returnTo) };
  }

  const post = await getPublicPost(supabase, postId);
  if (!post) {
    return { ok: false, message: "这条内容暂时不可收藏。" };
  }

  const { data: existing, error: existingError } = await supabase
    .from("post_favorites")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    return { ok: false, message: "收藏状态读取失败，请稍后再试。" };
  }

  if (existing?.id) {
    const { error } = await supabase.from("post_favorites").delete().eq("id", existing.id).eq("user_id", user.id);
    if (error) return { ok: false, message: "取消收藏失败，请稍后再试。" };

    revalidatePost(post.post_type, postId);
    return {
      ok: true,
      message: "已取消收藏。",
      isFavorited: false,
      favoriteCount: await getFavoriteCount(supabase, postId),
    };
  }

  const { error } = await supabase.from("post_favorites").insert({ post_id: postId, user_id: user.id });
  if (error) {
    return { ok: false, message: error.code === "23505" ? "你已经收藏过这条内容。" : "收藏失败，请稍后再试。" };
  }

  revalidatePost(post.post_type, postId);
  return {
    ok: true,
    message: "已收藏。",
    isFavorited: true,
    favoriteCount: await getFavoriteCount(supabase, postId),
  };
}

export async function submitPostReport(postId: string, reason: string, description: string, returnTo: string): Promise<ReportActionResult> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "Supabase 环境变量尚未配置，暂时无法提交举报。" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "请先登录后再举报。", authRequired: true, loginHref: loginHref(returnTo) };
  }

  if (!reportReasons.has(reason)) {
    return { ok: false, message: "请选择有效的举报原因。" };
  }

  const post = await getPublicPost(supabase, postId);
  if (!post) {
    return { ok: false, message: "这条内容暂时不可举报。" };
  }

  const { data: existing, error: existingError } = await supabase
    .from("post_reports")
    .select("id")
    .eq("post_id", postId)
    .eq("reporter_id", user.id)
    .maybeSingle();

  if (existingError) {
    return { ok: false, message: "举报状态读取失败，请稍后再试。" };
  }

  if (existing?.id) {
    return { ok: true, message: "你已经举报过这条内容，我们会尽快处理。", alreadyReported: true };
  }

  const detail = description.trim().slice(0, 1000) || null;
  const { error } = await supabase.from("post_reports").insert({
    post_id: postId,
    reporter_id: user.id,
    reason,
    detail,
  });

  if (error) {
    return { ok: false, message: "举报提交失败，请稍后再试。" };
  }

  revalidatePost(post.post_type, postId);
  return { ok: true, message: "已收到举报，我们会尽快处理。" };
}

export async function recordPostView(postId: string, visitorId: string | null): Promise<ViewActionResult> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "missing_config" };
  }

  const post = await getPublicPost(supabase, postId);
  if (!post) {
    return { ok: false, message: "not_public" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const safeVisitorId = visitorId?.trim().slice(0, 80) || null;
  if (!user && !safeVisitorId) {
    return { ok: false, message: "missing_actor" };
  }

  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent")?.slice(0, 500) ?? null;

  const { data: rpcData, error: rpcError } = await supabase.rpc("record_post_view", {
    p_post_id: postId,
    p_visitor_id: user ? null : safeVisitorId,
    p_user_agent: userAgent,
  });

  if (!rpcError) {
    return { ok: true, viewCount: viewCountFromRpcResult(rpcData as RecordPostViewRpcResult | null) ?? (await getViewCount(supabase, postId)) };
  }

  if (rpcError.code !== "PGRST202" && rpcError.code !== "42883") {
    console.error("[posts] record post view rpc failed", { postId, visitorId: safeVisitorId, error: rpcError });
    return { ok: false, message: "view_failed" };
  }

  const { error } = await supabase.from("post_views").insert({
    post_id: postId,
    user_id: user?.id ?? null,
    visitor_id: user ? null : safeVisitorId,
    user_agent: userAgent,
  });

  if (error) {
    console.error("[posts] record post view insert failed", { postId, visitorId: safeVisitorId, error });
    return { ok: false, message: "view_failed" };
  }

  await supabase.rpc("refresh_post_stats", { p_post_id: postId });

  return { ok: true, viewCount: await getViewCount(supabase, postId) };
}

export async function getPostViewCount(postId: string): Promise<ViewActionResult> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "missing_config" };
  }

  const post = await getPublicPost(supabase, postId);
  if (!post) {
    return { ok: false, message: "not_public" };
  }

  return { ok: true, viewCount: await getViewCount(supabase, postId) };
}
