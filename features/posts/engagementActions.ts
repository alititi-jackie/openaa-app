"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_CITY_SLUG } from "./constants";
import type { PostType } from "./types";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export type ViewActionResult = {
  ok: boolean;
  message?: string;
  viewCount?: number;
};

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
