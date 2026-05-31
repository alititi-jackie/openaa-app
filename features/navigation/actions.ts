"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_NAVIGATION_CATEGORIES } from "./constants";
import { validateNavigationCategoryForm, validateNavigationLinkForm, validateUserNavigationLinkForm } from "./validators";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export type NavigationActionState = { ok: boolean; message: string };

type AdminActionContext =
  | { ok: false; message: string }
  | {
      ok: true;
      supabase: SupabaseServerClient;
      userId: string;
    };

type UserActionContext =
  | { ok: false; message: string }
  | {
      ok: true;
      supabase: SupabaseServerClient;
      userId: string;
    };

const ok = (message: string): NavigationActionState => ({ ok: true, message });
const fail = (message: string): NavigationActionState => ({ ok: false, message });

async function getAdminActionContext(): Promise<AdminActionContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Supabase 环境变量未配置，暂时无法保存导航配置。" };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, message: "请先登录管理员账号。" };

  const { data: allowed, error } = await supabase.rpc("has_admin_permission", { p_permission_key: "manage_navigation" });
  if (error || !allowed) return { ok: false, message: "当前账号没有 manage_navigation 权限。" };

  return { ok: true, supabase, userId: user.id };
}

async function getUserActionContext(): Promise<UserActionContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Supabase 环境变量未配置，暂时无法保存我的导航。" };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, message: "请先登录后再管理我的导航。" };
  return { ok: true, supabase, userId: user.id };
}

async function auditLog(context: Extract<AdminActionContext, { ok: true }>, action: string, entityType: string, entityId: string | null, afterData?: unknown) {
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
        entity_type: "navigation_link",
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

export async function createDefaultNavigationCategories(_state: NavigationActionState, _formData: FormData): Promise<NavigationActionState> {
  void _state;
  void _formData;
  const context = await getAdminActionContext();
  if (!context.ok) return fail(context.message);

  const { error } = await context.supabase.from("navigation_categories").upsert(DEFAULT_NAVIGATION_CATEGORIES, { onConflict: "slug" });
  if (error) return fail("默认导航分类创建失败，请稍后再试。");
  if (!(await auditLog(context, "create_default_navigation_categories", "navigation_categories", "default", { categories: DEFAULT_NAVIGATION_CATEGORIES.map((item) => item.slug) }))) {
    return fail("默认分类已创建，但审计日志写入失败。");
  }

  revalidateNavigation();
  return ok("默认导航分类已创建。");
}

export async function upsertNavigationCategory(_state: NavigationActionState, formData: FormData): Promise<NavigationActionState> {
  const context = await getAdminActionContext();
  if (!context.ok) return fail(context.message);

  const validation = validateNavigationCategoryForm(formData);
  if (!validation.ok) return fail(validation.message);
  const { id, name, slug, description, icon, sortOrder, isActive } = validation.value;
  const payload = { name, slug, description, icon, sort_order: sortOrder, is_active: isActive, updated_at: new Date().toISOString() };
  const result = id
    ? await context.supabase.from("navigation_categories").update(payload).eq("id", id).select("id").single()
    : await context.supabase.from("navigation_categories").insert(payload).select("id").single();

  if (result.error || !result.data) return fail("导航分类保存失败，请检查 slug 是否重复。");
  if (!(await auditLog(context, id ? "update_navigation_category" : "create_navigation_category", "navigation_categories", result.data.id, payload))) {
    return fail("分类已保存，但审计日志写入失败。");
  }

  revalidateNavigation();
  return ok("导航分类已保存。");
}

export async function upsertNavigationLink(_state: NavigationActionState, formData: FormData): Promise<NavigationActionState> {
  const context = await getAdminActionContext();
  if (!context.ok) return fail(context.message);

  const validation = validateNavigationLinkForm(formData);
  if (!validation.ok) return fail(validation.message);
  const value = validation.value;
  const imageAssetId = value.imageUrl ? await upsertExternalImageAsset(context, value.imageUrl, value.id) : null;
  if (imageAssetId === false) return fail("导航图片保存失败，请确认地址为 https://img.openaa.com/。");

  const payload = {
    category_id: value.categoryId,
    title: value.title,
    description: value.description,
    url: value.url,
    icon: value.icon,
    icon_image_asset_id: imageAssetId,
    open_mode: value.openMode,
    sort_order: value.sortOrder,
    is_active: value.isActive,
    is_featured: value.isFeatured,
    updated_at: new Date().toISOString(),
  };

  const result = value.id
    ? await context.supabase.from("navigation_links").update(payload).eq("id", value.id).select("id").single()
    : await context.supabase.from("navigation_links").insert(payload).select("id").single();

  if (result.error || !result.data) return fail("导航链接保存失败。");

  if (imageAssetId && !value.id) {
    await context.supabase.from("image_assets").update({ entity_id: result.data.id }).eq("id", imageAssetId).eq("owner_id", context.userId);
  }

  if (!(await auditLog(context, value.id ? "update_navigation_link" : "create_navigation_link", "navigation_links", result.data.id, payload))) {
    return fail("链接已保存，但审计日志写入失败。");
  }

  revalidateNavigation();
  return ok("导航链接已保存。");
}

export async function toggleNavigationLinkFlag(_state: NavigationActionState, formData: FormData): Promise<NavigationActionState> {
  const context = await getAdminActionContext();
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  const field = readText(formData, "field");
  const value = readText(formData, "value") === "true";
  if (!id) return fail("缺少导航链接 ID。");
  if (field !== "is_active" && field !== "is_featured") return fail("不支持的导航字段。");

  const payload = { [field]: value, updated_at: new Date().toISOString() };
  const { error } = await context.supabase.from("navigation_links").update(payload).eq("id", id);
  if (error) return fail("导航链接状态更新失败。");

  const action = field === "is_active" ? (value ? "enable_navigation_link" : "disable_navigation_link") : value ? "feature_navigation_link" : "unfeature_navigation_link";
  if (!(await auditLog(context, action, "navigation_links", id, payload))) return fail("状态已更新，但审计日志写入失败。");

  revalidateNavigation();
  return ok("导航链接状态已更新。");
}

export async function upsertUserNavigationLink(_state: NavigationActionState, formData: FormData): Promise<NavigationActionState> {
  const context = await getUserActionContext();
  if (!context.ok) return fail(context.message);

  const validation = validateUserNavigationLinkForm(formData);
  if (!validation.ok) return fail(validation.message);
  const value = validation.value;
  const payload = {
    title: value.title,
    url: value.url,
    icon: value.icon,
    sort_order: value.sortOrder,
    open_mode: value.openMode,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const result = value.id
    ? await context.supabase.from("user_navigation_links").update(payload).eq("id", value.id).eq("user_id", context.userId).select("id").single()
    : await context.supabase.from("user_navigation_links").insert({ ...payload, user_id: context.userId }).select("id").single();

  if (result.error || !result.data) return fail("我的导航保存失败。");
  revalidatePath("/navigation/my");
  return ok(value.id ? "我的导航已保存。" : "我的导航已添加。");
}

export async function deleteUserNavigationLink(_state: NavigationActionState, formData: FormData): Promise<NavigationActionState> {
  const context = await getUserActionContext();
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  if (!id) return fail("缺少导航链接 ID。");
  const { error } = await context.supabase
    .from("user_navigation_links")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", context.userId);

  if (error) return fail("我的导航删除失败。");
  revalidatePath("/navigation/my");
  return ok("我的导航已删除。");
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function revalidateNavigation() {
  revalidatePath("/");
  revalidatePath("/navigation");
  revalidatePath("/navigation/my");
  revalidatePath("/admin/navigation");
}
