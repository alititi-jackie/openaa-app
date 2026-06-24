import { ALLOWED_NAVIGATION_IMAGE_HOSTS, NAVIGATION_SLUG_PATTERN } from "./constants";
import { normalizeWebsiteUrl } from "@/lib/validation/url";
import type { NavigationOpenMode } from "./types";

type ValidationResult<T> = { ok: true; value: T } | { ok: false; message: string };

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readInteger(formData: FormData, key: string, label: string) {
  const raw = readText(formData, key);
  if (!raw) return 0;
  const value = Number(raw);
  if (!Number.isInteger(value)) throw new Error(`${label} 必须是整数。`);
  return value;
}

function normalizeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function clampDisplayLimit(value: number) {
  if (value < 0) return 0;
  return Math.min(value, 999);
}

export function normalizeNavigationUrl(raw: string): ValidationResult<string> {
  return normalizeWebsiteUrl(raw, {
    allowInternalPath: true,
    requiredMessage: "请输入网址，例如 openaa.com",
    invalidMessage: "网址格式不正确。",
  });
}

export function normalizeNavigationImageUrl(raw: string): ValidationResult<string | null> {
  const value = raw.trim();
  if (!value) return { ok: true, value: null };

  const lower = value.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:")) {
    return { ok: false, message: "图片地址不允许使用 javascript: 或 data:。" };
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return { ok: false, message: "图片地址必须使用 https。" };
    if (!ALLOWED_NAVIGATION_IMAGE_HOSTS.has(url.hostname.toLowerCase())) {
      return { ok: false, message: "图片地址当前仅支持 https://img.openaa.com/。" };
    }
    return { ok: true, value: url.toString() };
  } catch {
    return { ok: false, message: "图片 URL 格式不正确。" };
  }
}

function readOpenMode(formData: FormData): NavigationOpenMode {
  const value = readText(formData, "open_mode");
  if (value === "same" || value === "new") return value;
  return "auto";
}

export function validateNavigationCategoryForm(formData: FormData): ValidationResult<{
  id: string | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  displayLimit: number;
  isActive: boolean;
}> {
  try {
    const name = readText(formData, "name");
    const slug = normalizeSlug(readText(formData, "slug") || name);
    if (!name) return { ok: false, message: "分类名称不能为空。" };
    if (!slug || !NAVIGATION_SLUG_PATTERN.test(slug)) return { ok: false, message: "分类 slug 只能包含小写字母、数字和连字符。" };

    return {
      ok: true,
      value: {
        id: readText(formData, "id") || null,
        name,
        slug,
        description: readText(formData, "description") || null,
        icon: readText(formData, "icon") || null,
        sortOrder: readInteger(formData, "sort_order", "分类排序"),
        displayLimit: clampDisplayLimit(readInteger(formData, "display_limit", "前台显示数量")),
        isActive: formData.get("is_active") === "on",
      },
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "分类表单格式不正确。" };
  }
}

export function validateNavigationLinkForm(formData: FormData): ValidationResult<{
  id: string | null;
  categoryId: string | null;
  title: string;
  description: string | null;
  url: string;
  icon: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  openMode: NavigationOpenMode;
}> {
  try {
    const title = readText(formData, "title");
    const url = normalizeNavigationUrl(readText(formData, "url"));
    const imageUrl = normalizeNavigationImageUrl(readText(formData, "image_url"));

    if (!title) return { ok: false, message: "网站名称不能为空。" };
    if (!url.ok) return url;
    if (!imageUrl.ok) return imageUrl;

    return {
      ok: true,
      value: {
        id: readText(formData, "id") || null,
        categoryId: readText(formData, "category_id") || null,
        title,
        description: readText(formData, "description") || null,
        url: url.value,
        icon: readText(formData, "icon") || null,
        imageUrl: imageUrl.value,
        sortOrder: readInteger(formData, "sort_order", "网站排序"),
        isActive: formData.get("is_active") === "on",
        isFeatured: formData.get("is_featured") === "on",
        openMode: readOpenMode(formData),
      },
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "网站表单格式不正确。" };
  }
}

export function validateUserNavigationLinkForm(formData: FormData): ValidationResult<{
  id: string | null;
  title: string;
  url: string;
  icon: string | null;
  sortOrder: number;
  openMode: NavigationOpenMode;
}> {
  try {
    const url = normalizeNavigationUrl(readText(formData, "url"));
    if (!url.ok) return url;
    const title = readText(formData, "title") || titleFromNavigationUrl(url.value);
    if (!title) return { ok: false, message: "请输入网站名称，或输入有效网址后自动生成。" };

    return {
      ok: true,
      value: {
        id: readText(formData, "id") || null,
        title,
        url: url.value,
        icon: readText(formData, "icon") || null,
        sortOrder: readInteger(formData, "sort_order", "排序"),
        openMode: readOpenMode(formData),
      },
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "我的导航表单格式不正确。" };
  }
}

function titleFromNavigationUrl(value: string) {
  try {
    if (value.startsWith("/")) {
      const parts = value.split("/").filter(Boolean);
      return parts[parts.length - 1] ?? "OpenAA";
    }
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "");
    const parts = hostname.split(".").filter(Boolean);
    const nameParts = parts.length > 2 ? parts.slice(0, -1) : parts.slice(0, 1);
    return nameParts.map(capitalize).join(" ");
  } catch {
    return "";
  }
}

function capitalize(value: string) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
