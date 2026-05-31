import { DEFAULT_NAVIGATION_CATEGORIES } from "./constants";
import type {
  NavigationCategory,
  NavigationCategoryRecord,
  NavigationImageAsset,
  NavigationLink,
  NavigationLinkRecord,
  UserNavigationLink,
  UserNavigationLinkRecord,
} from "./types";

function firstOrNull<T>(value: T[] | T | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function fallbackNavigationCategories(): NavigationCategory[] {
  return DEFAULT_NAVIGATION_CATEGORIES.map((category) => ({
    id: null,
    slug: category.slug,
    name: category.name,
    description: category.description,
    icon: category.icon,
    sortOrder: category.sort_order,
    isActive: category.is_active,
  }));
}

export function mapNavigationCategory(record: NavigationCategoryRecord): NavigationCategory {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    description: record.description,
    icon: record.icon,
    sortOrder: record.sort_order,
    isActive: record.is_active,
  };
}

function categoryFor(record: NavigationLinkRecord) {
  const category = firstOrNull(record.navigation_categories);
  return {
    id: category?.id ?? record.category_id,
    name: category?.name ?? "导航",
    slug: category?.slug ?? null,
  };
}

function imageUrlFor(record: NavigationLinkRecord) {
  const asset = firstOrNull<NavigationImageAsset>(record.image_assets);
  return asset?.external_url || asset?.public_url || null;
}

export function mapNavigationLink(record: NavigationLinkRecord): NavigationLink {
  const category = categoryFor(record);
  return {
    id: record.id,
    categoryId: category.id,
    categoryName: category.name,
    categorySlug: category.slug,
    title: record.title,
    description: record.description,
    url: record.url,
    icon: record.icon,
    imageUrl: imageUrlFor(record),
    openMode: record.open_mode === "same" ? "same" : "new",
    sortOrder: record.sort_order,
    isActive: record.is_active,
    isFeatured: record.is_featured,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export function mapUserNavigationLink(record: UserNavigationLinkRecord): UserNavigationLink {
  return {
    id: record.id,
    title: record.title,
    url: record.url,
    icon: record.icon,
    sortOrder: record.sort_order,
    isActive: record.is_active !== false,
    openMode: record.open_mode === "same" ? "same" : "new",
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}
