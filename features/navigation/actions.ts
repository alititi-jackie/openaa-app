"use server";

import { revalidatePath } from "next/cache";
import { hasAdminModule, hasAdminModulePermission, isSuperAdmin } from "@/lib/permissions/admin";
import { writeAdminAuditLog } from "@/lib/permissions/adminAuditLog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_NAVIGATION_CATEGORIES } from "./constants";
import { validateNavigationCategoryForm, validateNavigationLinkForm, validateUserNavigationLinkForm } from "./validators";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export type NavigationActionState = { ok: boolean; message: string; id?: string };

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

type SuperAdminNavigationActionContext = AdminActionContext;

const ok = (message: string, id?: string): NavigationActionState => ({ ok: true, message, id });
const fail = (message: string): NavigationActionState => ({ ok: false, message });

async function getAdminActionContext(): Promise<AdminActionContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Supabase 环境变量未配置，暂时无法保存导航配置。" };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, message: "请先登录管理员账号。" };

  if (!(await hasAdminModulePermission("navigation", "manage_navigation"))) {
    return { ok: false, message: "当前账号没有导航管理模块权限。" };
  }

  return { ok: true, supabase, userId: user.id };
}

async function getSuperAdminNavigationActionContext(): Promise<SuperAdminNavigationActionContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Supabase 环境变量未配置，暂时无法管理公共导航内容。" };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, message: "请先登录管理员账号。" };
  if (!(await isSuperAdmin())) return { ok: false, message: "只有超级管理员可以执行此操作。" };

  return { ok: true, supabase, userId: user.id };
}

async function getRecycleBinNavigationActionContext(): Promise<AdminActionContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Supabase 环境变量未配置，暂时无法管理公共导航内容。" };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, message: "请先登录管理员账号。" };
  if (!(await hasAdminModule("recycle-bin"))) return { ok: false, message: "当前账号没有回收站模块权限。" };

  return { ok: true, supabase, userId: user.id };
}

async function getUserActionContext(): Promise<UserActionContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "保存失败，请稍后再试。" };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, message: "登录状态失效，请重新登录。" };
  return { ok: true, supabase, userId: user.id };
}

async function auditLog(context: Extract<AdminActionContext, { ok: true }>, action: string, entityType: string, entityId: string | null, afterData?: unknown) {
  return writeAdminAuditLog({
    actorId: context.userId,
    action,
    entityType,
    entityId,
    afterData,
  });
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
  const { id, name, slug, description, icon, sortOrder, displayLimit, isActive } = validation.value;
  const previous = id
    ? await context.supabase.from("navigation_categories").select("is_active,sort_order").eq("id", id).maybeSingle()
    : { data: null };
  const payload = { name, slug, description, icon, sort_order: sortOrder, display_limit: displayLimit, is_active: isActive, updated_at: new Date().toISOString() };
  const result = id
    ? await context.supabase.from("navigation_categories").update(payload).eq("id", id).select("id").single()
    : await context.supabase.from("navigation_categories").insert(payload).select("id").single();

  if (result.error || !result.data) return fail("导航分类保存失败，请检查 slug 是否重复。");
  const action = id ? navigationCategoryAuditAction(previous.data?.is_active, isActive, previous.data?.sort_order, sortOrder) : "create_navigation_category";
  if (!(await auditLog(context, action, "navigation_categories", result.data.id, payload))) {
    return fail("分类已保存，但审计日志写入失败。");
  }

  revalidateNavigation();
  return ok("导航分类已保存。");
}

export async function updateNavigationCategoryDisplayLimit(_state: NavigationActionState, formData: FormData): Promise<NavigationActionState> {
  const context = await getAdminActionContext();
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  const displayLimit = Number(readText(formData, "display_limit"));
  if (!id) return fail("缺少导航分类 ID。");
  if (!Number.isInteger(displayLimit) || displayLimit < 0) return fail("前台显示数量必须是 0 或正整数。");

  const payload = { display_limit: Math.min(displayLimit, 999), updated_at: new Date().toISOString() };
  const { error, data } = await context.supabase.from("navigation_categories").update(payload).eq("id", id).select("id").single();
  if (error || !data) return fail("前台显示数量保存失败。");

  if (!(await auditLog(context, "update_navigation_category_display_limit", "navigation_categories", id, payload))) {
    return fail("显示数量已保存，但审计日志写入失败。");
  }

  revalidateNavigation();
  return ok("前台显示数量已保存。", id);
}

export async function moveNavigationCategory(_state: NavigationActionState, formData: FormData): Promise<NavigationActionState> {
  const context = await getAdminActionContext();
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  const direction = readText(formData, "direction");
  if (!id) return fail("缺少导航分类 ID。");
  if (direction !== "up" && direction !== "down") return fail("不支持的排序方向。");

  const { data, error } = await context.supabase
    .from("navigation_categories")
    .select("id,sort_order,name")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) return fail("分类排序读取失败。");
  const categories = data ?? [];
  const currentIndex = categories.findIndex((category) => category.id === id);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= categories.length) return ok("分类顺序已是当前状态。", id);

  const normalized = categories.map((category, index) => ({ id: category.id, sort_order: (index + 1) * 10 }));
  const currentOrder = normalized[currentIndex].sort_order;
  normalized[currentIndex].sort_order = normalized[targetIndex].sort_order;
  normalized[targetIndex].sort_order = currentOrder;

  for (const category of normalized) {
    const { error: updateError } = await context.supabase
      .from("navigation_categories")
      .update({ sort_order: category.sort_order, updated_at: new Date().toISOString() })
      .eq("id", category.id);

    if (updateError) return fail("分类排序保存失败。");
  }

  if (!(await auditLog(context, "sort_navigation_categories", "navigation_categories", id, { direction, order: normalized }))) {
    return fail("分类排序已保存，但审计日志写入失败。");
  }

  revalidateNavigation();
  return ok("分类排序已更新。", id);
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
  return ok("导航链接已保存。", result.data.id);
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
  const { error, data } = await context.supabase.from("navigation_links").update(payload).eq("id", id).select("id").single();
  if (error || !data) return fail("导航链接状态更新失败。");

  const action = field === "is_active" ? (value ? "enable_navigation_link" : "disable_navigation_link") : value ? "feature_navigation_link" : "unfeature_navigation_link";
  if (!(await auditLog(context, action, "navigation_links", id, payload))) return fail("状态已更新，但审计日志写入失败。");

  revalidateNavigation();
  return ok("导航链接状态已更新。");
}

export async function deleteNavigationLink(_state: NavigationActionState, formData: FormData): Promise<NavigationActionState> {
  const context = await getAdminActionContext();
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  if (!id) return fail("缺少导航链接 ID。");

  const payload = { deleted_at: new Date().toISOString(), deleted_by: context.userId, is_active: false, updated_at: new Date().toISOString() };
  const { error, data } = await context.supabase.from("navigation_links").update(payload).eq("id", id).select("id").single();
  if (error || !data) return fail("导航链接删除失败。");

  if (!(await auditLog(context, "soft_delete_navigation_link", "navigation_links", id, payload))) {
    return fail("链接已删除，但审计日志写入失败。");
  }

  revalidateNavigation();
  return ok("导航链接已删除。");
}

export async function restoreNavigationLink(_state: NavigationActionState, formData: FormData): Promise<NavigationActionState> {
  const context = await getRecycleBinNavigationActionContext();
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  if (!id) return fail("缺少导航链接 ID。");

  const payload = { deleted_at: null, deleted_by: null, updated_at: new Date().toISOString() };
  const { error, data } = await context.supabase.from("navigation_links").update(payload).eq("id", id).select("id").single();
  if (error || !data) return fail("导航链接恢复失败。");

  if (!(await auditLog(context, "restore_navigation_link", "navigation_links", id, payload))) {
    return fail("链接已恢复，但审计日志写入失败。");
  }

  revalidateNavigation();
  revalidatePath("/admin/recycle-bin");
  return ok("导航链接已恢复。");
}

export async function permanentlyDeleteNavigationLink(_state: NavigationActionState, formData: FormData): Promise<NavigationActionState> {
  const context = await getSuperAdminNavigationActionContext();
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  if (!id) return fail("缺少导航链接 ID。");

  const { data: before } = await context.supabase.from("navigation_links").select("id,title,url,deleted_at").eq("id", id).maybeSingle();
  if (!before?.deleted_at) return fail("只有已删除导航链接可以永久删除。");

  const { error, data } = await context.supabase.from("navigation_links").delete().eq("id", id).select("id").single();
  if (error || !data) return fail("导航链接永久删除失败。");

  if (!(await auditLog(context, "permanently_delete_navigation_link", "navigation_links", id, before))) {
    return fail("链接已永久删除，但审计日志写入失败。");
  }

  revalidateNavigation();
  revalidatePath("/admin/recycle-bin");
  return ok("导航链接已永久删除。");
}

export async function upsertUserNavigationLink(_state: NavigationActionState, formData: FormData): Promise<NavigationActionState> {
  const context = await getUserActionContext();
  if (!context.ok) return fail(context.message);

  const validation = validateUserNavigationLinkForm(formData);
  if (!validation.ok) return fail(validation.message);
  const value = validation.value;
  const sortOrder = value.id ? value.sortOrder : await nextUserNavigationSortOrder(context);
  const duplicateCheck = await findDuplicateUserNavigationLink(context, value.url, value.id);
  if (!duplicateCheck.ok) return fail("保存失败，请稍后再试。");
  if (duplicateCheck.exists) return fail("该网址已存在。");

  const payload = {
    title: value.title,
    url: value.url,
    icon: value.icon,
    sort_order: sortOrder,
    open_mode: "new" as const,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const result = value.id
    ? await context.supabase.from("user_navigation_links").update(payload).eq("id", value.id).eq("user_id", context.userId).select("id").single()
    : await context.supabase.from("user_navigation_links").insert({ ...payload, user_id: context.userId }).select("id").single();

  if (result.error || !result.data) {
    console.error("[navigation] user navigation upsert failed", {
      userId: context.userId,
      linkId: value.id,
      url: value.url,
      error: result.error,
    });

    return fail(userNavigationSaveErrorMessage(result.error));
  }
  revalidatePath("/navigation/my");
  return ok(value.id ? "已更新我的导航。" : "已保存到我的导航。");
}

async function findDuplicateUserNavigationLink(context: Extract<UserActionContext, { ok: true }>, url: string, id: string | null) {
  let query = context.supabase
    .from("user_navigation_links")
    .select("id")
    .eq("user_id", context.userId)
    .eq("url", url)
    .eq("is_active", true)
    .limit(1);

  if (id) query = query.neq("id", id);

  const { data, error } = await query;
  if (error) {
    console.error("[navigation] user navigation duplicate check failed", {
      userId: context.userId,
      linkId: id,
      url,
      error,
    });

    return { ok: false as const, exists: false };
  }

  return { ok: true as const, exists: (data ?? []).length > 0 };
}

function userNavigationSaveErrorMessage(error: { code?: string; message?: string } | null) {
  if (error?.code === "23505") return "该网址已存在。";
  if (error?.code === "42501" || error?.message?.toLowerCase().includes("row-level security")) return "登录状态失效，请重新登录。";
  return "保存失败，请稍后再试。";
}

export async function deleteUserNavigationLink(_state: NavigationActionState, formData: FormData): Promise<NavigationActionState> {
  const context = await getUserActionContext();
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  if (!id) return fail("缺少导航链接 ID。");
  const { error, data } = await context.supabase
    .from("user_navigation_links")
    .delete()
    .eq("id", id)
    .eq("user_id", context.userId)
    .select("id")
    .single();

  if (error || !data) return fail("我的导航删除失败，请确认这条链接属于当前账号。");
  revalidatePath("/navigation/my");
  return ok("我的导航已删除。");
}

export async function moveUserNavigationLink(_state: NavigationActionState, formData: FormData): Promise<NavigationActionState> {
  const context = await getUserActionContext();
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  const direction = readText(formData, "direction");
  if (!id) return fail("缺少导航链接 ID。");
  if (direction !== "up" && direction !== "down") return fail("不支持的排序方向。");

  const { data, error } = await context.supabase
    .from("user_navigation_links")
    .select("id,sort_order,title")
    .eq("user_id", context.userId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) return fail("我的导航排序读取失败。");
  const links = data ?? [];
  const index = links.findIndex((link) => link.id === id);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= links.length) return ok("排序已是当前状态。");

  const normalized = links.map((link, linkIndex) => ({ id: link.id, sort_order: (linkIndex + 1) * 10 }));
  const currentOrder = normalized[index].sort_order;
  normalized[index].sort_order = normalized[targetIndex].sort_order;
  normalized[targetIndex].sort_order = currentOrder;

  for (const link of normalized) {
    const { error: updateError } = await context.supabase
      .from("user_navigation_links")
      .update({ sort_order: link.sort_order, updated_at: new Date().toISOString() })
      .eq("id", link.id)
      .eq("user_id", context.userId);

    if (updateError) return fail("我的导航排序保存失败。");
  }

  revalidatePath("/navigation/my");
  return ok("排序已更新。");
}

async function nextUserNavigationSortOrder(context: Extract<UserActionContext, { ok: true }>) {
  const { data } = await context.supabase
    .from("user_navigation_links")
    .select("sort_order")
    .eq("user_id", context.userId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  const currentFirst = typeof data?.sort_order === "number" ? data.sort_order : 0;
  return currentFirst - 10;
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function navigationCategoryAuditAction(previousActive: boolean | undefined, nextActive: boolean, previousSortOrder: number | undefined, nextSortOrder: number) {
  if (previousActive === false && nextActive) return "enable_navigation_category";
  if (previousActive === true && !nextActive) return "disable_navigation_category";
  if (typeof previousSortOrder === "number" && previousSortOrder !== nextSortOrder) return "sort_navigation_category";
  return "update_navigation_category";
}

function revalidateNavigation() {
  revalidatePath("/");
  revalidatePath("/navigation");
  revalidatePath("/navigation/my");
  revalidatePath("/admin/navigation");
}
