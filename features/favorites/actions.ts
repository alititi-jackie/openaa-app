"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FavoriteTarget } from "./types";

export type FavoriteActionResult = {
  ok: boolean;
  message: string;
  authRequired?: boolean;
  loginHref?: string;
  isFavorited?: boolean;
};

function loginHref(returnTo: string) {
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}

function sanitizeText(value: string, maxLength: number) {
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function normalizeTarget(target: FavoriteTarget): FavoriteTarget | null {
  const type = sanitizeText(target.type, 80);
  const id = sanitizeText(target.id, 200);
  const url = target.url.trim();
  const title = sanitizeText(target.title, 300);
  const category = target.category ? sanitizeText(target.category, 120) : null;

  if (!type || !id || !title) return null;
  if ((!url.startsWith("/") || url.startsWith("//")) && !url.startsWith("https://")) return null;

  return { type, id, url, title, category };
}

export async function toggleFavorite(target: FavoriteTarget, returnTo: string): Promise<FavoriteActionResult> {
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

  const normalized = normalizeTarget(target);
  if (!normalized) {
    return { ok: false, message: "当前内容暂时不可收藏。" };
  }

  const { data: existing, error: existingError } = await supabase
    .from("user_favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", normalized.type)
    .eq("target_id", normalized.id)
    .maybeSingle();

  if (existingError) {
    return { ok: false, message: "收藏状态读取失败，请稍后再试。" };
  }

  if (existing?.id) {
    const { error } = await supabase.from("user_favorites").delete().eq("id", existing.id).eq("user_id", user.id);
    if (error) return { ok: false, message: "取消收藏失败，请稍后再试。" };

    revalidateFavoritePaths(normalized.url);
    return { ok: true, message: "已取消收藏。", isFavorited: false };
  }

  const { error } = await supabase.from("user_favorites").insert({
    user_id: user.id,
    target_type: normalized.type,
    target_id: normalized.id,
    target_url: normalized.url,
    title: normalized.title,
    category: normalized.category,
  });

  if (error) {
    return { ok: false, message: error.code === "23505" ? "你已经收藏过这条内容。" : "收藏失败，请稍后再试。" };
  }

  revalidateFavoritePaths(normalized.url);
  return { ok: true, message: "已收藏。", isFavorited: true };
}

export async function removeFavorite(id: string): Promise<FavoriteActionResult> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "Supabase 环境变量尚未配置，暂时无法取消收藏。" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "请先登录。", authRequired: true, loginHref: loginHref("/profile/favorites") };
  }

  const { error } = await supabase.from("user_favorites").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false, message: "取消收藏失败，请稍后再试。" };

  revalidatePath("/profile");
  revalidatePath("/profile/favorites");
  return { ok: true, message: "已取消收藏。", isFavorited: false };
}

function revalidateFavoritePaths(targetUrl: string) {
  revalidatePath("/profile");
  revalidatePath("/profile/favorites");
  revalidatePath(targetUrl);

  const topLevel = targetUrl.split("/").filter(Boolean)[0];
  if (topLevel) revalidatePath(`/${topLevel}`);
}
