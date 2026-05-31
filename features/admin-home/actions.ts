"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { defaultHomeSections, defaultLatestTicker, defaultTopQuickLinks } from "./defaults";
import type { AdminHomeActionState } from "./types";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
type AdminActionContext =
  | { ok: false; message: string }
  | {
      ok: true;
      supabase: SupabaseServerClient;
      userId: string;
    };

const ok = (message: string): AdminHomeActionState => ({ ok: true, message });
const fail = (message: string): AdminHomeActionState => ({ ok: false, message });
const auditFailure = () => fail("操作已执行，但审计日志写入失败，请联系管理员检查 admin_audit_logs。");

async function getAdminActionContext(permissionKey: string): Promise<AdminActionContext> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "Supabase 环境变量未配置，暂时无法保存后台配置。" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "请先登录管理员账号。" };
  }

  const { data: allowed, error } = await supabase.rpc("has_admin_permission", {
    p_permission_key: permissionKey,
  });

  if (error || !allowed) {
    return { ok: false, message: "当前账号没有执行此操作的后台权限。" };
  }

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

export async function createDefaultHomeConfig(state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  void state;
  void formData;
  const context = await getAdminActionContext("manage_home_sections");
  if (!context.ok) return fail(context.message);

  const topLinksAllowed = await hasPermission(context.supabase, "manage_top_links");
  const tickerAllowed = await hasPermission(context.supabase, "manage_latest_ticker");
  const cityId = await getDefaultCityId(context.supabase);

  const { error: sectionError } = await context.supabase.from("home_sections").upsert(defaultHomeSections, { onConflict: "key" });
  if (sectionError) return fail("默认首页模块创建失败，请稍后再试。");
  if (!(await auditLog(context, "create_default_home_sections", "home_sections", "default", { sections: defaultHomeSections.map((section) => section.key) }))) {
    return auditFailure();
  }

  if (topLinksAllowed) {
    const { error: topLinkError } = await context.supabase.from("top_quick_links").upsert(
      defaultTopQuickLinks.map((item) => ({ ...item, city_id: cityId })),
      { onConflict: "key" },
    );
    if (topLinkError) return fail("首页模块已创建，但顶部快捷导航默认配置保存失败。");
    if (!(await auditLog(context, "create_default_top_quick_links", "top_quick_links", "default", { links: defaultTopQuickLinks.map((link) => link.key) }))) {
      return auditFailure();
    }
  }

  if (tickerAllowed) {
    const { data: existingTicker } = await context.supabase.from("latest_ticker").select("id").limit(1);
    if (!existingTicker || existingTicker.length === 0) {
      const { error: tickerError } = await context.supabase.from("latest_ticker").insert(defaultLatestTicker);
      if (tickerError) return fail("默认首页模块已创建，但最新动态默认配置保存失败。");
      if (!(await auditLog(context, "create_default_latest_ticker", "latest_ticker", "default", { count: defaultLatestTicker.length }))) {
        return auditFailure();
      }
    }
  }

  revalidateAdminHome();
  return ok("默认首页配置已创建。");
}

export async function updateHomeSection(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getAdminActionContext("manage_home_sections");
  if (!context.ok) return fail(context.message);

  const key = readText(formData, "key");
  const title = readText(formData, "title");
  const sortOrder = readInteger(formData, "sort_order", "模块排序");
  const isVisible = formData.get("is_visible") === "on";
  const description = readText(formData, "description") || null;
  const config = readJsonObject(formData, "config");

  if (!key || !title) return fail("模块 key 和标题不能为空。");
  if (!sortOrder.ok) return fail(sortOrder.message);
  if (!config.ok) return fail(config.message);

  const payload = {
    key,
    title,
    description,
    module: "home",
    config: config.value,
    is_visible: isVisible,
    sort_order: sortOrder.value,
    updated_at: new Date().toISOString(),
  };

  const { error } = await context.supabase.from("home_sections").upsert(payload, { onConflict: "key" });
  if (error) return fail("首页模块保存失败，请检查字段后重试。");

  if (!(await auditLog(context, "update_home_section", "home_sections", key, payload))) return auditFailure();
  revalidateAdminHome();
  return ok(`模块「${title}」已保存。`);
}

export async function upsertTopQuickLink(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getAdminActionContext("manage_top_links");
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  const title = readText(formData, "title");
  const href = normalizeLink(readText(formData, "url"));
  const openMode = readOpenMode(formData);
  const sortOrder = readInteger(formData, "sort_order", "快捷入口排序");
  const isActive = formData.get("is_active") === "on";
  const icon = readText(formData, "icon") || null;
  const cityId = await getDefaultCityId(context.supabase);

  if (!title) return fail("快捷入口标题不能为空。");
  if (!href.ok) return fail(href.message);
  if (!sortOrder.ok) return fail(sortOrder.message);

  const payload = {
    title,
    href: href.value,
    open_mode: openMode,
    sort_order: sortOrder.value,
    is_active: isActive,
    icon,
    city_id: cityId,
  };

  const result = id
    ? await context.supabase.from("top_quick_links").update(payload).eq("id", id).select("id").single()
    : await context.supabase.from("top_quick_links").insert({ ...payload, key: slugKey(title) }).select("id").single();

  if (result.error || !result.data) return fail("顶部快捷入口保存失败，请检查 URL 或排序。");

  if (!(await auditLog(context, id ? "update_top_quick_link" : "create_top_quick_link", "top_quick_links", result.data.id, payload))) {
    return auditFailure();
  }
  revalidateAdminHome();
  return ok("顶部快捷入口已保存。");
}

export async function setTopQuickLinkInactive(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getAdminActionContext("manage_top_links");
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  if (!id) return fail("缺少快捷入口 ID。");

  const { error } = await context.supabase.from("top_quick_links").update({ is_active: false }).eq("id", id);
  if (error) return fail("快捷入口停用失败。");

  if (!(await auditLog(context, "disable_top_quick_link", "top_quick_links", id, { is_active: false }))) return auditFailure();
  revalidateAdminHome();
  return ok("快捷入口已停用。");
}

export async function upsertLatestTicker(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getAdminActionContext("manage_latest_ticker");
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  const title = readText(formData, "title");
  const href = normalizeOptionalLink(readText(formData, "href"));
  const isEnabled = formData.get("is_enabled") === "on";
  const sortOrder = readInteger(formData, "sort_order", "最新动态排序");
  const startsAt = readDateTime(formData, "starts_at");
  const endsAt = readDateTime(formData, "ends_at");

  if (!title) return fail("最新动态标题不能为空。");
  if (!href.ok) return fail(href.message);
  if (!sortOrder.ok) return fail(sortOrder.message);

  const payload = {
    title,
    href: href.value,
    module: "home",
    is_enabled: isEnabled,
    sort_order: sortOrder.value,
    starts_at: startsAt,
    ends_at: endsAt,
  };

  const result = id
    ? await context.supabase.from("latest_ticker").update(payload).eq("id", id).select("id").single()
    : await context.supabase.from("latest_ticker").insert(payload).select("id").single();

  if (result.error || !result.data) return fail("最新动态保存失败。");

  if (!(await auditLog(context, id ? "update_latest_ticker" : "create_latest_ticker", "latest_ticker", result.data.id, payload))) {
    return auditFailure();
  }
  revalidateAdminHome();
  return ok("最新动态已保存。");
}

export async function upsertHomeBanner(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getAdminActionContext("manage_home_sections");
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  const title = readText(formData, "title");
  const subtitle = readText(formData, "subtitle") || null;
  const href = normalizeOptionalLink(readText(formData, "href"));
  const imageUrl = normalizeImageUrl(readText(formData, "image_url"));
  const openMode = readOpenMode(formData);
  const isActive = formData.get("is_active") === "on";
  const sortOrder = readInteger(formData, "sort_order", "Banner 排序");
  const startsAt = readDateTime(formData, "starts_at");
  const endsAt = readDateTime(formData, "ends_at");
  const cityId = await getDefaultCityId(context.supabase);

  if (!title) return fail("Banner 标题不能为空。");
  if (!href.ok) return fail(href.message);
  if (!imageUrl.ok) return fail(imageUrl.message);
  if (!sortOrder.ok) return fail(sortOrder.message);
  if (!id && !imageUrl.value) return fail("新增 Banner 需要填写 https://img.openaa.com/ 图片 URL。");

  const imageAssetId = imageUrl.value ? await upsertExternalImageAsset(context, imageUrl.value, id || null) : readText(formData, "image_asset_id") || null;
  if (imageAssetId === false) return fail("图片 URL 保存失败，请确认地址为 https://img.openaa.com/ 开头。");

  const payload = {
    title,
    subtitle,
    href: href.value,
    open_mode: openMode,
    image_asset_id: imageAssetId,
    city_id: cityId,
    is_active: isActive,
    sort_order: sortOrder.value,
    starts_at: startsAt,
    ends_at: endsAt,
  };

  const result = id
    ? await context.supabase.from("home_banners").update(payload).eq("id", id).select("id").single()
    : await context.supabase.from("home_banners").insert(payload).select("id").single();

  if (result.error || !result.data) return fail("首页 Banner 保存失败。");

  if (imageAssetId && !id) {
    await context.supabase.from("image_assets").update({ entity_id: result.data.id }).eq("id", imageAssetId).eq("owner_id", context.userId);
  }

  if (!(await auditLog(context, id ? "update_home_banner" : "create_home_banner", "home_banners", result.data.id, payload))) {
    return auditFailure();
  }
  revalidateAdminHome();
  return ok("首页 Banner 已保存。");
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
        entity_type: "home_banner",
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

async function hasPermission(supabase: SupabaseServerClient, permissionKey: string) {
  const { data } = await supabase.rpc("has_admin_permission", { p_permission_key: permissionKey });
  return Boolean(data);
}

async function getDefaultCityId(supabase: SupabaseServerClient) {
  const { data } = await supabase.from("cities").select("id").eq("slug", "ny").maybeSingle();
  return data?.id ?? null;
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readInteger(formData: FormData, key: string, label: string): { ok: true; value: number } | { ok: false; message: string } {
  const raw = readText(formData, key);
  if (!raw) return { ok: true, value: 0 };
  const value = Number(raw);
  if (!Number.isInteger(value)) return { ok: false, message: `${label} 必须是整数。` };
  return { ok: true, value };
}

function readOpenMode(formData: FormData) {
  return readText(formData, "open_mode") === "new" ? "new" : "same";
}

function readDateTime(formData: FormData, key: string) {
  const value = readText(formData, key);
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function readJsonObject(formData: FormData, key: string): { ok: true; value: Record<string, unknown> } | { ok: false; message: string } {
  try {
    const parsed = JSON.parse(readText(formData, key) || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, message: "配置 JSON 必须是对象。" };
    }
    return { ok: true, value: parsed as Record<string, unknown> };
  } catch {
    return { ok: false, message: "配置 JSON 格式不正确。" };
  }
}

function normalizeLink(raw: string): { ok: true; value: string } | { ok: false; message: string } {
  if (!raw) return { ok: false, message: "URL 不能为空。" };
  if (raw.startsWith("/") && !raw.startsWith("//")) {
    if (raw.slice(1) === "secondhand") return { ok: false, message: "请使用 /marketplace，不要使用旧的二手路由。" };
    return { ok: true, value: raw };
  }

  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return { ok: false, message: "外部链接必须使用 https。" };
    return { ok: true, value: url.toString() };
  } catch {
    return { ok: false, message: "URL 格式不正确。" };
  }
}

function normalizeOptionalLink(raw: string): { ok: true; value: string | null } | { ok: false; message: string } {
  if (!raw) return { ok: true, value: null };
  const link = normalizeLink(raw);
  return link.ok ? link : link;
}

function normalizeImageUrl(raw: string): { ok: true; value: string | null } | { ok: false; message: string } {
  if (!raw) return { ok: true, value: null };

  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "img.openaa.com") {
      return { ok: false, message: "图片 URL 必须是 https://img.openaa.com/ 下的地址。" };
    }
    return { ok: true, value: url.toString() };
  } catch {
    return { ok: false, message: "图片 URL 格式不正确。" };
  }
}

function slugKey(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "link"}-${Date.now()}`;
}

function revalidateAdminHome() {
  revalidatePath("/");
  revalidatePath("/admin/home");
  revalidatePath("/admin/top-links");
}
