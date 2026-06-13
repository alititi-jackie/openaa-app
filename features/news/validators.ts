import { ALLOWED_NEWS_COVER_HOSTS, NEWS_SLUG_PATTERN, NEWS_STATUS_OPTIONS } from "./constants";
import type { NewsStatus } from "./types";

export type NewsValidationResult =
  | {
      ok: true;
      value: {
        title: string;
        slug: string;
        categoryId: string | null;
        excerpt: string | null;
        body: string;
        status: NewsStatus;
        isFeatured: boolean;
        isPinned: boolean;
        pinnedOrder: number;
        pinnedUntil: string | null;
        publishedAt: string | null;
        seoTitle: string | null;
        seoDescription: string | null;
        coverImageUrl: string | null;
      };
    }
  | { ok: false; message: string };

export type NewsCategoryValidationResult =
  | {
      ok: true;
      value: {
        id: string | null;
        name: string;
        slug: string;
        description: string | null;
        sortOrder: number;
        isActive: boolean;
      };
    }
  | { ok: false; message: string };

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readInteger(formData: FormData, key: string, label: string) {
  const raw = readText(formData, key);
  if (!raw) return 0;
  const value = Number(raw);
  if (!Number.isInteger(value)) {
    throw new Error(`${label} 必须是整数。`);
  }
  return value;
}

function readNonnegativeInteger(formData: FormData, key: string, label: string) {
  const value = readInteger(formData, key, label);
  if (value < 0) {
    throw new Error(`${label} 必须是 0 或正整数。`);
  }
  return value;
}

function readDateTime(formData: FormData, key: string) {
  const raw = readText(formData, key);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function validateSlug(slug: string) {
  return NEWS_SLUG_PATTERN.test(slug);
}

function normalizeCoverUrl(raw: string): { ok: true; value: string | null } | { ok: false; message: string } {
  if (!raw) return { ok: true, value: null };

  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") {
      return { ok: false, message: "封面图片必须使用 https URL。" };
    }
    if (!ALLOWED_NEWS_COVER_HOSTS.has(url.hostname.toLowerCase())) {
      return { ok: false, message: "本阶段封面图片仅支持 https://img.openaa.com/。" };
    }
    return { ok: true, value: url.toString() };
  } catch {
    return { ok: false, message: "封面图片 URL 格式不正确。" };
  }
}

export function validateNewsForm(formData: FormData): NewsValidationResult {
  const title = readText(formData, "title");
  const slug = normalizeSlug(readText(formData, "slug") || title);
  const body = readText(formData, "body");
  const cover = normalizeCoverUrl(readText(formData, "cover_image_url"));
  const status = readText(formData, "status") as NewsStatus;

  if (!title) return { ok: false, message: "新闻标题不能为空。" };
  if (!slug || !validateSlug(slug)) return { ok: false, message: "Slug 只能包含小写字母、数字和连字符。" };
  if (!body) return { ok: false, message: "新闻正文不能为空。" };
  if (!NEWS_STATUS_OPTIONS.includes(status as (typeof NEWS_STATUS_OPTIONS)[number])) return { ok: false, message: "新闻状态不正确。" };
  if (!cover.ok) return cover;

  const publishedAt = readDateTime(formData, "published_at");
  const pinnedUntil = readDateTime(formData, "pinned_until");

  return {
    ok: true,
    value: {
      title,
      slug,
      categoryId: readText(formData, "category_id") || null,
      excerpt: readText(formData, "excerpt") || null,
      body,
      status,
      isFeatured: formData.get("is_featured") === "on",
      isPinned: formData.get("is_pinned") === "on",
      pinnedOrder: readNonnegativeInteger(formData, "pinned_order", "置顶排序"),
      pinnedUntil,
      publishedAt: status === "published" ? publishedAt || new Date().toISOString() : publishedAt,
      seoTitle: readText(formData, "seo_title") || null,
      seoDescription: readText(formData, "seo_description") || null,
      coverImageUrl: cover.value,
    },
  };
}

export function validateNewsCategoryForm(formData: FormData): NewsCategoryValidationResult {
  try {
    const name = readText(formData, "name");
    const slug = normalizeSlug(readText(formData, "slug") || name);

    if (!name) return { ok: false, message: "分类名称不能为空。" };
    if (!slug || !validateSlug(slug)) return { ok: false, message: "分类 slug 只能包含小写字母、数字和连字符。" };

    return {
      ok: true,
      value: {
        id: readText(formData, "id") || null,
        name,
        slug,
        description: readText(formData, "description") || null,
        sortOrder: readInteger(formData, "sort_order", "分类排序"),
        isActive: formData.get("is_active") === "on",
      },
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "分类表单格式不正确。" };
  }
}
