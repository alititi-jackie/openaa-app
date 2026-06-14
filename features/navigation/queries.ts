import "server-only";

import { hasAdminPermission } from "@/lib/permissions/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_NAVIGATION_LIMIT, NAVIGATION_PUBLIC_LIMIT } from "./constants";
import { fallbackNavigationCategories, mapNavigationCategory, mapNavigationLink, mapUserNavigationLink } from "./mappers";
import type {
  AdminNavigationPermissions,
  NavigationCategory,
  NavigationCategoryRecord,
  NavigationLink,
  NavigationLinkRecord,
  NavigationQueryResult,
  UserNavigationLink,
  UserNavigationLinkRecord,
} from "./types";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

const navigationLinkSelect = `
  id,
  category_id,
  title,
  description,
  url,
  icon,
  icon_image_asset_id,
  open_mode,
  sort_order,
  is_active,
  is_featured,
  deleted_at,
  metadata,
  created_at,
  updated_at,
  navigation_categories(id,slug,name,description,icon,sort_order,display_limit,is_active),
  image_assets(public_url,external_url)
`;

const navigationLinkPublicSelect = navigationLinkSelect.replace(
  "navigation_categories(id,slug,name,description,icon,sort_order,display_limit,is_active)",
  "navigation_categories!inner(id,slug,name,description,icon,sort_order,display_limit,is_active)",
);

function missingConfig<T>(data: T): NavigationQueryResult<T> {
  return { state: "missing_config", data };
}

function errorResult<T>(data: T, error: unknown): NavigationQueryResult<T> {
  const message = error instanceof Error ? error.message : String(error);
  return { state: "error", data, error: message };
}

function sanitizeSearchTerm(value?: string) {
  return value?.trim().replace(/[%,()]/g, " ").replace(/\s+/g, " ").slice(0, 80) ?? "";
}

export async function getNavigationCategories(includeInactive = false): Promise<NavigationQueryResult<NavigationCategory[]>> {
  const supabase = await createSupabaseServerClient();
  const fallback = fallbackNavigationCategories();
  if (!supabase) return missingConfig(fallback);

  try {
    let query = supabase
      .from("navigation_categories")
      .select("id,slug,name,description,icon,sort_order,display_limit,is_active")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (!includeInactive) query = query.eq("is_active", true).gt("display_limit", 0);

    const { data, error } = await query;
    if (error) return errorResult(fallback, error.message);
    const categories = ((data ?? []) as NavigationCategoryRecord[]).map(mapNavigationCategory);
    return { state: "ready", data: categories.length > 0 ? categories : fallback };
  } catch (error) {
    return errorResult(fallback, error);
  }
}

export async function getPublicNavigationLinks(params: { categorySlug?: string; q?: string; featuredOnly?: boolean; limit?: number } = {}): Promise<NavigationQueryResult<NavigationLink[]>> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return missingConfig([]);

  try {
    const q = sanitizeSearchTerm(params.q);
    let query = supabase
      .from("navigation_links")
      .select(navigationLinkPublicSelect)
      .eq("is_active", true)
      .is("deleted_at", null)
      .eq("navigation_categories.is_active", true)
      .gt("navigation_categories.display_limit", 0)
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true })
      .limit(params.limit ?? NAVIGATION_PUBLIC_LIMIT);

    if (params.categorySlug) query = query.eq("navigation_categories.slug", params.categorySlug);
    if (params.featuredOnly) query = query.eq("is_featured", true);
    if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);

    const { data, error } = await query;
    if (error) return errorResult([], error.message);
    return { state: "ready", data: ((data ?? []) as unknown as NavigationLinkRecord[]).map(mapNavigationLink) };
  } catch (error) {
    return errorResult([], error);
  }
}

export async function getNavigationPageData(params: { categorySlug?: string; q?: string } = {}) {
  const [categories, links] = await Promise.all([
    getNavigationCategories(false),
    getPublicNavigationLinks(params),
  ]);
  const visibleCategories = categories.data.filter((category) => category.displayLimit > 0);
  const visibleCategoryKeys = new Set(visibleCategories.flatMap((category) => [category.id, category.slug].filter(Boolean)));
  const visibleLinks = links.data.filter((link) => (link.categoryId ? visibleCategoryKeys.has(link.categoryId) : false) || (link.categorySlug ? visibleCategoryKeys.has(link.categorySlug) : false));

  return {
    state: categories.state === "error" || links.state === "error" ? ("error" as const) : categories.state === "missing_config" || links.state === "missing_config" ? ("missing_config" as const) : ("ready" as const),
    categories: visibleCategories,
    links: visibleLinks,
    featuredLinks: [],
    error: categories.error ?? links.error,
  };
}

export async function getCurrentUserNavigationLinks(): Promise<NavigationQueryResult<UserNavigationLink[]> & { userId: string | null }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ...missingConfig([]), userId: null };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { state: "ready", data: [], userId: null };

  const { data, error } = await supabase
    .from("user_navigation_links")
    .select("id,user_id,title,url,icon,sort_order,is_active,open_mode,created_at,updated_at")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) return { ...errorResult([], error.message), userId: user.id };
  return { state: "ready", data: ((data ?? []) as UserNavigationLinkRecord[]).map(mapUserNavigationLink), userId: user.id };
}

export async function getAdminNavigationPermissions(): Promise<AdminNavigationPermissions> {
  const manageNavigation = await hasAdminPermission("manage_navigation");
  return { manageNavigation };
}

export async function getAdminNavigationData(params: { categoryId?: string; q?: string } = {}) {
  const supabase = await createSupabaseServerClient();
  const permissions = await getAdminNavigationPermissions();
  const categoriesFallback = fallbackNavigationCategories();

  if (!supabase) {
    return { state: "missing_config" as const, permissions, categories: categoriesFallback, links: [] as NavigationLink[] };
  }

  if (!permissions.manageNavigation) {
    return { state: "ready" as const, permissions, categories: categoriesFallback, links: [] as NavigationLink[] };
  }

  const [categories, links] = await Promise.all([readAdminCategories(supabase), readAdminLinks(supabase, params)]);

  return {
    state: categories.state === "error" || links.state === "error" ? ("error" as const) : ("ready" as const),
    permissions,
    categories: categories.data.length > 0 ? categories.data : categoriesFallback,
    links: links.data,
    error: categories.error ?? links.error,
  };
}

async function readAdminCategories(supabase: SupabaseServerClient): Promise<NavigationQueryResult<NavigationCategory[]>> {
  const { data, error } = await supabase
    .from("navigation_categories")
    .select("id,slug,name,description,icon,sort_order,display_limit,is_active")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) return errorResult([], error.message);
  return { state: "ready", data: ((data ?? []) as NavigationCategoryRecord[]).map(mapNavigationCategory) };
}

async function readAdminLinks(supabase: SupabaseServerClient, params: { categoryId?: string; q?: string }): Promise<NavigationQueryResult<NavigationLink[]>> {
  const q = sanitizeSearchTerm(params.q);
  let query = supabase
    .from("navigation_links")
    .select(navigationLinkSelect)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false })
    .limit(ADMIN_NAVIGATION_LIMIT);

  if (params.categoryId) query = query.eq("category_id", params.categoryId);
  if (q) query = query.or(`title.ilike.%${q}%,url.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return errorResult([], error.message);
  return { state: "ready", data: ((data ?? []) as unknown as NavigationLinkRecord[]).map(mapNavigationLink) };
}
