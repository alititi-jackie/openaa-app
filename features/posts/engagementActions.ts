"use server";

import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_CITY_SLUG } from "./constants";
import type { PostType } from "./types";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export type ViewActionResult = {
  ok: boolean;
  message?: string;
  viewCount?: number;
};

type RecordPostViewRpcResult = number | { view_count?: number | null } | Array<{ view_count?: number | null }>;

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

  if (error || !data) return null;
  return data as { id: string; post_type: PostType };
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
