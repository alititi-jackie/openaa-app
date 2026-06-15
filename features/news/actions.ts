"use server";

import { revalidatePath } from "next/cache";
import { hasAdminModulePermission } from "@/lib/permissions/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_NEWS_CATEGORIES } from "./constants";
import { validateNewsCategoryForm, validateNewsForm } from "./validators";
import type { NewsStatus } from "./types";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export type NewsActionState = { ok: boolean; message: string; id?: string };

type AdminActionContext =
  | { ok: false; message: string }
  | {
      ok: true;
      supabase: SupabaseServerClient;
      userId: string;
    };

const ok = (message: string, id?: string): NewsActionState => ({ ok: true, message, id });
const fail = (message: string): NewsActionState => ({ ok: false, message });

async function getAdminActionContext(permissionKey: string): Promise<AdminActionContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Supabase 环境变量未配置，暂时无法保存新闻配置。" };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, message: "请先登录管理员账号。" };

  if (!(await hasAdminModulePermission("news", permissionKey))) return { ok: false, message: "当前账号没有新闻管理模块权限。" };

  return { ok: true, supabase, userId: user.id };
}

async function hasPermission(supabase: SupabaseServerClient, permissionKey: string) {
  void supabase;
  return hasAdminModulePermission("news", permissionKey);
}

async function auditLog(
  context: Extract<AdminActionContext, { ok: true }>,
  action: string,
  entityType: string,
  entityId: string | null,
  afterData?: unknown,
) {
  const { error } = await context.supabase.from("admin_audit_logs").insert({
    actor_id: context.userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    after_data: afterData ?? null,
  });

  return !error;
}

async function upsertExternalImageAsset(context: Extract<AdminActionContext, { ok: true }>, imageUrl: string, entityId: string | null) {
  try {
    const externalHost = new URL(imageUrl).hostname.toLowerCase();
    const { data, error } = await context.supabase
      .from("image_assets")
      .insert({
        source_type: "external",
        external_url: imageUrl,
        external_host: externalHost,
        owner_id: context.userId,
        entity_type: "news_post",
        entity_id: entityId,
        status: "active",
        is_public: true,
      })
      .select("id")
      .single();

    if (error || !data) return false;
    return data.id as string;
  } catch {
    return false;
  }
}

async function uploadNewsCoverImageAsset(context: Extract<AdminActionContext, { ok: true }>, file: File, entityId: string | null) {
  const validation = validateImageFile(file);
  if (!validation.ok) return false;

  const imageId = crypto.randomUUID();
  const path = `news-covers/${context.userId}/${entityId || "draft"}/${imageId}.${validation.extension}`;
  const { error: uploadError } = await context.supabase.storage.from("news-cover-images").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) return false;

  const { data: publicUrlData } = context.supabase.storage.from("news-cover-images").getPublicUrl(path);
  const { data, error } = await context.supabase
    .from("image_assets")
    .insert({
      source_type: "storage",
      bucket: "news-cover-images",
      path,
      public_url: publicUrlData.publicUrl,
      owner_id: context.userId,
      entity_type: "news_post",
      entity_id: entityId,
      mime_type: file.type,
      size_bytes: file.size,
      status: "active",
      is_public: true,
    })
    .select("id")
    .single();

  if (error || !data) return false;
  return data.id as string;
}

export async function createDefaultNewsCategories(_state: NewsActionState, _formData: FormData): Promise<NewsActionState> {
  void _state;
  void _formData;
  const context = await getAdminActionContext("manage_news_categories");
  if (!context.ok) return fail(context.message);

  const { error } = await context.supabase.from("news_categories").upsert(DEFAULT_NEWS_CATEGORIES, { onConflict: "slug" });
  if (error) return fail("默认新闻分类创建失败，请稍后再试。");
  if (!(await auditLog(context, "create_default_news_categories", "news_categories", "default", { categories: DEFAULT_NEWS_CATEGORIES.map((item) => item.slug) }))) {
    return fail("默认分类已创建，但审计日志写入失败。");
  }

  revalidateNews();
  return ok("默认新闻分类已创建。");
}

export async function upsertNewsCategory(_state: NewsActionState, formData: FormData): Promise<NewsActionState> {
  const context = await getAdminActionContext("manage_news_categories");
  if (!context.ok) return fail(context.message);

  const validation = validateNewsCategoryForm(formData);
  if (!validation.ok) return fail(validation.message);
  const { id, name, slug, description, sortOrder, isActive } = validation.value;
  const payload = { name, slug, description, sort_order: sortOrder, is_active: isActive, updated_at: new Date().toISOString() };
  const result = id
    ? await context.supabase.from("news_categories").update(payload).eq("id", id).select("id").single()
    : await context.supabase.from("news_categories").insert(payload).select("id").single();

  if (result.error || !result.data) return fail("新闻分类保存失败，请检查 slug 是否重复。");
  if (!(await auditLog(context, id ? "update_news_category" : "create_news_category", "news_categories", result.data.id, payload))) {
    return fail("分类已保存，但审计日志写入失败。");
  }

  revalidateNews();
  return ok("新闻分类已保存。", result.data.id);
}

export async function upsertNewsPost(_state: NewsActionState, formData: FormData): Promise<NewsActionState> {
  const id = readText(formData, "id");
  const context = await getAdminActionContext(id ? "edit_news" : "create_news");
  if (!context.ok) return fail(context.message);

  const validation = validateNewsForm(formData);
  if (!validation.ok) return fail(validation.message);
  const canPublish = validation.value.status === "published" ? await hasPermission(context.supabase, "publish_news") : true;
  if (!canPublish) return fail("当前账号没有发布新闻权限。");

  const before = id ? await readNewsPost(context.supabase, id) : null;
  const coverImageFile = readFile(formData, "cover_image_file");
  const removeCoverImage = formData.get("remove_cover_image") === "on";
  const existingCoverImageAssetId = readText(formData, "cover_image_asset_id") || null;
  const coverImageAssetId = removeCoverImage
    ? null
    : coverImageFile
      ? await uploadNewsCoverImageAsset(context, coverImageFile, id || null)
      : validation.value.coverImageUrl
        ? await upsertExternalImageAsset(context, validation.value.coverImageUrl, id || null)
        : existingCoverImageAssetId;
  if (coverImageAssetId === false) {
    return fail("封面图片保存失败，请确认上传的是 5MB 以内的 JPG、PNG、WebP，或填写 https://img.openaa.com/ 图片地址。");
  }

  const payload = {
    title: validation.value.title,
    slug: validation.value.slug,
    category_id: validation.value.categoryId,
    excerpt: validation.value.excerpt,
    body: validation.value.body,
    cover_image_asset_id: coverImageAssetId,
    status: validation.value.status,
    is_featured: validation.value.isFeatured,
    is_pinned: validation.value.isPinned,
    pinned_order: validation.value.pinnedOrder,
    pinned_until: validation.value.pinnedUntil,
    published_at: validation.value.publishedAt,
    seo_title: validation.value.seoTitle,
    seo_description: validation.value.seoDescription,
    updated_at: new Date().toISOString(),
  };

  const result = id
    ? await context.supabase.from("news_posts").update(payload).eq("id", id).select("id,slug").single()
    : await context.supabase.from("news_posts").insert({ ...payload, author_id: context.userId }).select("id,slug").single();

  if (result.error || !result.data) return fail("新闻保存失败，请检查 slug 是否重复。");

  if (coverImageAssetId && !id) {
    await context.supabase.from("image_assets").update({ entity_id: result.data.id }).eq("id", coverImageAssetId).eq("owner_id", context.userId);
  }

  if (before?.cover_image_asset_id && (removeCoverImage || (coverImageAssetId && before.cover_image_asset_id !== coverImageAssetId))) {
    await markImageAssetDeleted(context.supabase, before.cover_image_asset_id);
  }

  if (!(await auditLog(context, id ? "update_news_post" : "create_news_post", "news_posts", result.data.id, payload))) {
    return fail("新闻已保存，但审计日志写入失败。");
  }

  revalidateNews(result.data.slug);
  return ok(id ? "新闻已保存。" : "新闻已创建。", result.data.id);
}

export async function setNewsPostStatus(_state: NewsActionState, formData: FormData): Promise<NewsActionState> {
  const id = readText(formData, "id");
  const slug = readText(formData, "slug");
  const status = readText(formData, "status") as NewsStatus;
  const permission = status === "published" ? "publish_news" : status === "deleted" ? "delete_news" : "edit_news";
  const context = await getAdminActionContext(permission);
  if (!context.ok) return fail(context.message);
  if (!id) return fail("缺少新闻 ID。");

  const now = new Date().toISOString();
  const payload: {
    status: NewsStatus;
    published_at: string | null;
    deleted_at?: string | null;
    deleted_by?: string | null;
    updated_at: string;
  } = {
    status,
    published_at: status === "published" ? now : null,
    updated_at: now,
  };
  if (status === "deleted") {
    payload.deleted_at = now;
    payload.deleted_by = context.userId;
  } else {
    payload.deleted_at = null;
    payload.deleted_by = null;
  }

  const { error } = await context.supabase.from("news_posts").update(payload).eq("id", id);
  if (error) return fail("新闻状态更新失败。");
  if (!(await auditLog(context, `set_news_${status}`, "news_posts", id, payload))) return fail("状态已更新，但审计日志写入失败。");

  revalidateNews(slug || undefined);
  return ok("新闻状态已更新。", id);
}

export async function toggleNewsPin(_state: NewsActionState, formData: FormData): Promise<NewsActionState> {
  const context = await getAdminActionContext("edit_news");
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  const slug = readText(formData, "slug");
  const isPinned = readText(formData, "is_pinned") === "true";
  if (!id) return fail("缺少新闻 ID。");

  const payload = { is_pinned: isPinned, updated_at: new Date().toISOString() };
  const { error } = await context.supabase.from("news_posts").update(payload).eq("id", id);
  if (error) return fail("置顶状态更新失败。");
  if (!(await auditLog(context, isPinned ? "pin_news_post" : "unpin_news_post", "news_posts", id, payload))) return fail("置顶状态已更新，但审计日志写入失败。");

  revalidateNews(slug || undefined);
  return ok(isPinned ? "新闻已置顶。" : "新闻已取消置顶。", id);
}

async function readNewsPost(supabase: SupabaseServerClient, id: string) {
  const { data } = await supabase.from("news_posts").select("id,cover_image_asset_id").eq("id", id).maybeSingle();
  return data ?? null;
}

async function markImageAssetDeleted(supabase: SupabaseServerClient, imageAssetId: string) {
  await supabase
    .from("image_assets")
    .update({ status: "deleted", deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", imageAssetId);
}

function readFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

function validateImageFile(file: File): { ok: true; extension: "jpg" | "png" | "webp" } | { ok: false } {
  if (!file || file.size <= 0 || file.size > 5 * 1024 * 1024) return { ok: false };
  if (file.type === "image/jpeg") return { ok: true, extension: "jpg" };
  if (file.type === "image/png") return { ok: true, extension: "png" };
  if (file.type === "image/webp") return { ok: true, extension: "webp" };
  return { ok: false };
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function revalidateNews(slug?: string) {
  revalidatePath("/");
  revalidatePath("/news");
  revalidatePath("/admin/news");
  if (slug) revalidatePath(`/news/${slug}`);
}
