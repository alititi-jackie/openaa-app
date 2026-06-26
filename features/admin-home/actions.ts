"use server";

import { revalidatePath } from "next/cache";
import { hasAdminModulePermission } from "@/lib/permissions/admin";
import { writeAdminAuditLog } from "@/lib/permissions/adminAuditLog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeWebsiteUrl } from "@/lib/validation/url";
import { defaultHomeSections, defaultLatestTicker, defaultTopQuickLinks } from "./defaults";
import { fallbackLatestPostSections } from "@/features/home/fallbacks";
import { normalizeHomeTickerSectionKey } from "@/features/home/tickerSections";
import type { AdminHomeActionState } from "./types";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
type AdminActionContext =
  | { ok: false; message: string }
  | {
      ok: true;
      supabase: SupabaseServerClient;
      userId: string;
    };

const ok = (message: string, id?: string, normalizedUrl?: string): AdminHomeActionState => ({ ok: true, message, id, normalizedUrl });
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

  if (!(await hasAdminModulePermission(moduleForPermission(permissionKey), permissionKey))) {
    return { ok: false, message: "当前账号没有首页配置模块权限。" };
  }

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

export async function updateLatestPostsSection(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getAdminActionContext("manage_home_sections");
  if (!context.ok) return fail(context.message);

  const sectionTitle = readText(formData, "section_title") || "最新发布";
  const sectionDescription = readText(formData, "section_description") || null;
  const sectionSortOrder = readInteger(formData, "section_sort_order", "最新发布模块排序");
  if (!sectionSortOrder.ok) return fail(sectionSortOrder.message);

  const sections = [];
  for (const fallback of fallbackLatestPostSections) {
    const limit = readIntegerInRange(formData, `limit_count_${fallback.key}`, `${fallback.title}显示数量`, 1, 30);
    const sortOrder = readInteger(formData, `sort_order_${fallback.key}`, `${fallback.title}排序`);
    if (!limit.ok) return fail(limit.message);
    if (!sortOrder.ok) return fail(sortOrder.message);

    sections.push({
      key: fallback.key,
      title: readText(formData, `title_${fallback.key}`) || fallback.title,
      nav_label: readText(formData, `nav_label_${fallback.key}`) || fallback.navLabel,
      post_type: fallback.postType,
      route: fallback.route,
      is_visible: formData.get(`is_visible_${fallback.key}`) === "on",
      sort_order: sortOrder.value,
      limit_count: limit.value,
      layout: fallback.layout,
      description: readText(formData, `description_${fallback.key}`) || fallback.description,
      empty_message: readText(formData, `empty_message_${fallback.key}`) || fallback.emptyMessage,
    });
  }

  const payload = {
    key: "latest_posts",
    title: sectionTitle,
    description: sectionDescription,
    module: "home",
    config: { sections },
    is_visible: formData.get("section_is_visible") === "on",
    sort_order: sectionSortOrder.value,
    updated_at: new Date().toISOString(),
  };

  const { error } = await context.supabase.from("home_sections").upsert(payload, { onConflict: "key" });
  if (error) return fail("最新发布模块保存失败，请检查字段后重试。");

  if (!(await auditLog(context, "update_latest_posts_section", "home_sections", "latest_posts", payload))) return auditFailure();
  revalidateAdminHome();
  return ok("最新发布模块已保存。");
}

export async function updateSeoContentSection(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getAdminActionContext("manage_home_sections");
  if (!context.ok) return fail(context.message);

  const seoTitle = readText(formData, "seo_title");
  const seoContent = readText(formData, "seo_content");

  if (!seoTitle) return fail("SEO 标题不能为空。");
  if (!seoContent) return fail("SEO 正文不能为空。");

  const { data: existing } = await context.supabase
    .from("home_sections")
    .select("key,title,description,module,is_visible,sort_order")
    .eq("key", "seo_content")
    .maybeSingle();

  const payload = {
    key: "seo_content",
    title: existing?.title || "SEO 文案",
    description: existing?.description ?? "首页 SEO 文案配置。",
    module: existing?.module || "home",
    config: {
      title: seoTitle,
      content: seoContent,
    },
    is_visible: true,
    sort_order: typeof existing?.sort_order === "number" ? existing.sort_order : 90,
    updated_at: new Date().toISOString(),
  };

  const { error } = await context.supabase.from("home_sections").upsert(payload, { onConflict: "key" });
  if (error) return fail("OpenAA SEO 保存失败，请稍后再试。");

  if (!(await auditLog(context, "update_seo_content_section", "home_sections", "seo_content", payload))) return auditFailure();
  revalidateAdminHome();
  return ok("OpenAA SEO 已保存。");
}

export async function upsertTopQuickLink(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getAdminActionContext("manage_top_links");
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  const href = normalizeWebsiteUrl(readText(formData, "url"), { allowInternalPath: true, requiredMessage: "URL 不能为空。", invalidMessage: "URL 格式不正确。" });
  const title = readText(formData, "title") || (href.ok ? titleFromUrl(href.value) : "");
  const openMode = readOpenMode(formData);
  const cityId = await getDefaultCityId(context.supabase);

  if (!title) return fail("顶部快捷导航名称不能为空。");
  if (!href.ok) return fail(href.message);

  const existing = id ? await readTopQuickLinkForUpdate(context.supabase, id) : null;
  if (id && !existing) return fail("顶部快捷导航不存在。");

  const payload = {
    title,
    href: href.value,
    open_mode: openMode,
    sort_order: existing?.sort_order ?? (await getFirstTopQuickLinkSortOrder(context.supabase)),
    is_active: existing?.is_active ?? true,
    icon: existing?.icon ?? null,
    city_id: cityId,
    updated_at: new Date().toISOString(),
  };

  const result = id
    ? await context.supabase.from("top_quick_links").update(payload).eq("id", id).select("id").single()
    : await context.supabase.from("top_quick_links").insert({ ...payload, key: slugKey(title) }).select("id").single();

  if (result.error || !result.data) return fail("顶部快捷导航保存失败，请检查网址。");

  if (!(await auditLog(context, id ? "update_top_quick_link" : "create_top_quick_link", "top_quick_links", result.data.id, payload))) {
    return auditFailure();
  }
  revalidateAdminHome();
  return ok("顶部快捷导航已保存。", result.data.id, href.value);
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

export async function setTopQuickLinkVisibility(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getAdminActionContext("manage_top_links");
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  const isActive = readText(formData, "is_active") === "true";
  if (!id) return fail("缺少快捷导航 ID。");

  const payload = { is_active: isActive, updated_at: new Date().toISOString() };
  const { error, data } = await context.supabase.from("top_quick_links").update(payload).eq("id", id).select("id").single();
  if (error || !data) return fail("快捷导航显示状态更新失败。");

  if (!(await auditLog(context, isActive ? "enable_top_quick_link" : "disable_top_quick_link", "top_quick_links", id, payload))) return auditFailure();
  revalidateAdminHome();
  return ok(isActive ? "快捷导航已显示。" : "快捷导航已隐藏。");
}

export async function deleteTopQuickLink(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getAdminActionContext("manage_top_links");
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  if (!id) return fail("缺少快捷导航 ID。");

  const { error, data } = await context.supabase.from("top_quick_links").delete().eq("id", id).select("id,title,href").single();
  if (error || !data) return fail("快捷导航删除失败。");

  if (!(await auditLog(context, "delete_top_quick_link", "top_quick_links", id, data))) return auditFailure();
  revalidateAdminHome();
  return ok("快捷导航已删除。");
}

export async function moveTopQuickLink(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getAdminActionContext("manage_top_links");
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  const direction = readText(formData, "direction") === "down" ? "down" : "up";
  if (!id) return fail("缺少快捷导航 ID。");

  const { data, error } = await context.supabase
    .from("top_quick_links")
    .select("id,sort_order")
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (error || !data) return fail("快捷导航排序读取失败。");

  const currentIndex = data.findIndex((item) => item.id === id);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (currentIndex < 0) return fail("快捷导航不存在。");
  if (targetIndex < 0 || targetIndex >= data.length) return ok("快捷导航排序未变化。");

  const reordered = [...data];
  const current = reordered[currentIndex];
  reordered[currentIndex] = reordered[targetIndex];
  reordered[targetIndex] = current;

  const updates = reordered.map((item, index) =>
    context.supabase
      .from("top_quick_links")
      .update({ sort_order: (index + 1) * 10, updated_at: new Date().toISOString() })
      .eq("id", item.id),
  );
  const results = await Promise.all(updates);
  if (results.some((result) => result.error)) return fail("快捷导航排序保存失败。");

  if (!(await auditLog(context, "move_top_quick_link", "top_quick_links", id, { direction }))) return auditFailure();
  revalidateAdminHome();
  return ok("快捷导航排序已更新。");
}

export async function upsertLatestTicker(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getAdminActionContext("manage_latest_ticker");
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  const intent = readText(formData, "intent") || "save";

  if (intent === "move_up" || intent === "move_down") {
    if (!id) return fail("缺少手动动态 ID。");
    return moveLatestTickerItem(context, id, intent === "move_up" ? "up" : "down");
  }

  if (intent === "enable" || intent === "disable") {
    if (!id) return fail("缺少手动动态 ID。");
    const isEnabled = intent === "enable";
    const { error } = await context.supabase.from("latest_ticker").update({ is_enabled: isEnabled, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return fail(isEnabled ? "手动动态启用失败。" : "手动动态停用失败。");
    if (!(await auditLog(context, isEnabled ? "enable_latest_ticker" : "disable_latest_ticker", "latest_ticker", id, { is_enabled: isEnabled }))) return auditFailure();
    revalidateAdminHome();
    return ok(isEnabled ? "手动动态已启用。" : "手动动态已停用。");
  }

  if (intent === "delete") {
    if (!id) return fail("缺少手动动态 ID。");
    if (formData.get("confirm_delete") !== "on") return fail("请先勾选确认删除这条动态。");
    const { error } = await context.supabase.from("latest_ticker").delete().eq("id", id);
    if (error) return fail("手动动态删除失败。");
    if (!(await auditLog(context, "delete_latest_ticker", "latest_ticker", id, { deleted: true }))) return auditFailure();
    revalidateAdminHome();
    return ok("手动动态已删除。");
  }

  const title = readText(formData, "title");
  const href = normalizeWebsiteUrl(readText(formData, "href"), { allowInternalPath: true, requiredMessage: "手动动态链接不能为空。", invalidMessage: "手动动态链接格式不正确。" });
  const isEnabled = formData.get("is_enabled") === "on";
  const sortOrder = id ? readInteger(formData, "sort_order", "手动动态排序") : await readNextManualTickerSortOrder(context.supabase);
  const startsAt = readDateTime(formData, "starts_at");
  const endsAt = readDateTime(formData, "ends_at");

  if (!title) return fail("手动动态标题不能为空。");
  if (!href.ok) return fail(href.message);
  if (!sortOrder.ok) return fail(sortOrder.message);

  const payload = {
    title,
    href: href.value,
    module: "manual",
    is_enabled: isEnabled,
    sort_order: sortOrder.value,
    starts_at: startsAt,
    ends_at: endsAt,
    updated_at: new Date().toISOString(),
  };

  const result = id
    ? await context.supabase.from("latest_ticker").update(payload).eq("id", id).select("id").single()
    : await context.supabase.from("latest_ticker").insert(payload).select("id").single();

  if (result.error || !result.data) return fail("手动动态保存失败。");

  if (!(await auditLog(context, id ? "update_latest_ticker" : "create_latest_ticker", "latest_ticker", result.data.id, payload))) {
    return auditFailure();
  }
  revalidateAdminHome();
  return ok(id ? "手动动态已保存。" : "手动动态已新增。");
}

export async function updateLatestTickerGlobalSettings(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getAdminActionContext("manage_latest_ticker");
  if (!context.ok) return fail(context.message);

  const isEnabled = formData.get("global_is_enabled") === "on";
  const intervalSeconds = readIntegerInRange(formData, "interval_seconds", "滚动间隔", 3, 10);
  if (!intervalSeconds.ok) return fail(intervalSeconds.message);

  const globalPayload = {
    id: 1,
    is_enabled: isEnabled,
    interval_seconds: intervalSeconds.value,
  };

  const globalResult = await context.supabase.from("latest_ticker_global_settings").upsert(globalPayload, { onConflict: "id" });
  if (globalResult.error) return fail("最新动态全局设置保存失败。");

  if (!(await auditLog(context, "update_latest_ticker_global_settings", "latest_ticker", "global_settings", { global: globalPayload }))) {
    return auditFailure();
  }

  revalidateAdminHome();
  return ok("最新动态全局设置已保存。");
}

export async function updateLatestTickerSettings(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getAdminActionContext("manage_latest_ticker");
  if (!context.ok) return fail(context.message);

  const sectionKeys = formData.getAll("section_key").filter((value): value is string => typeof value === "string");
  const sectionPayloads = [];

  for (const rawSectionKey of sectionKeys) {
    const sectionKey = normalizeHomeTickerSectionKey(rawSectionKey);
    if (!sectionKey) continue;

    const displayCount = readIntegerInRange(formData, `display_count_${sectionKey}`, "显示数量", 1, 20);
    const sortOrder = readInteger(formData, `sort_order_${sectionKey}`, "排序");
    if (!displayCount.ok) return fail(displayCount.message);
    if (!sortOrder.ok) return fail(sortOrder.message);

    sectionPayloads.push({
      section_key: sectionKey,
      section_name: readText(formData, `section_name_${sectionKey}`) || sectionKey,
      is_enabled: formData.get(`is_enabled_${sectionKey}`) === "on",
      sort_order: sortOrder.value,
      display_count: displayCount.value,
    });
  }

  const intent = readText(formData, "intent");
  if (intent.startsWith("move_up:") || intent.startsWith("move_down:")) {
    const [directionIntent, rawSectionKey] = intent.split(":");
    const sectionKey = normalizeHomeTickerSectionKey(rawSectionKey);
    if (!sectionKey) return fail("缺少要排序的自动动态分类。");
    const moved = moveTickerSectionPayloads(sectionPayloads, sectionKey, directionIntent === "move_up" ? "up" : "down");
    if (!moved.ok) return fail(moved.message);
  }

  const sectionsResult = await context.supabase.from("latest_ticker_sections").upsert(sectionPayloads, { onConflict: "section_key" });
  if (sectionsResult.error) return fail("最新动态分区设置保存失败。");

  if (!(await auditLog(context, intent.startsWith("move_") ? "move_latest_ticker_section" : "update_latest_ticker_sections", "latest_ticker", "sections", { sections: sectionPayloads }))) {
    return auditFailure();
  }

  revalidateAdminHome();
  return ok(intent.startsWith("move_") ? "自动动态排序已保存。" : "自动动态设置已保存。");
}

export async function upsertHomeBanner(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getAdminActionContext("manage_home_sections");
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  const title = readText(formData, "title");
  const subtitle = readText(formData, "subtitle") || null;
  const href = normalizeOptionalLink(readText(formData, "href"));
  const imageUrl = normalizeImageUrl(readText(formData, "image_url"));
  const imageFile = readFile(formData, "image_file");
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
  if (!id && !imageUrl.value && !imageFile) return fail("新增 Banner 需要上传图片或填写 https://img.openaa.com/ 图片 URL。");

  const before = id ? await readHomeBanner(context.supabase, id) : null;
  const imageAssetId = imageFile
    ? await uploadHomeBannerImageAsset(context, imageFile, id || null)
    : imageUrl.value
      ? await upsertExternalImageAsset(context, imageUrl.value, id || null)
      : readText(formData, "image_asset_id") || null;
  if (imageAssetId === false) return fail("图片保存失败，请确认上传的是 5MB 以内的 JPG、PNG、WebP，或填写 https://img.openaa.com/ 地址。");

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

  if (imageAssetId && before?.image_asset_id && before.image_asset_id !== imageAssetId) {
    await markImageAssetDeleted(context.supabase, before.image_asset_id);
  }

  if (!(await auditLog(context, id ? "update_home_banner" : "create_home_banner", "home_banners", result.data.id, payload))) {
    return auditFailure();
  }
  revalidateAdminHome();
  return ok("首页 Banner 已保存。");
}

export async function removeHomeBannerImage(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getAdminActionContext("manage_home_sections");
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  if (!id) return fail("缺少 Banner ID。");
  if (formData.get("confirm_remove_image") !== "on") return fail("请先勾选确认移除图片。");

  const before = await readHomeBanner(context.supabase, id);
  if (!before) return fail("Banner 不存在。");
  if (!before.image_asset_id) return fail("这条 Banner 没有可移除的图片。");

  const result = await context.supabase.from("home_banners").update({ image_asset_id: null, updated_at: new Date().toISOString() }).eq("id", id);
  if (result.error) return fail("Banner 图片移除失败。");

  await markImageAssetDeleted(context.supabase, before.image_asset_id);

  if (!(await auditLog(context, "remove_home_banner_image", "home_banners", id, { image_asset_id: null }))) {
    return auditFailure();
  }

  revalidateAdminHome();
  return ok("Banner 图片已移除。");
}

async function readHomeBanner(supabase: SupabaseServerClient, id: string) {
  const { data } = await supabase.from("home_banners").select("id,image_asset_id").eq("id", id).maybeSingle();
  return data ?? null;
}

async function readTopQuickLinkForUpdate(supabase: SupabaseServerClient, id: string) {
  const { data } = await supabase.from("top_quick_links").select("id,sort_order,is_active,icon").eq("id", id).maybeSingle();
  return data ?? null;
}

async function getFirstTopQuickLinkSortOrder(supabase: SupabaseServerClient) {
  const { data } = await supabase.from("top_quick_links").select("sort_order").order("sort_order", { ascending: true }).limit(1).maybeSingle();
  return typeof data?.sort_order === "number" ? data.sort_order - 10 : 0;
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

async function uploadHomeBannerImageAsset(context: Extract<AdminActionContext, { ok: true }>, file: File, entityId: string | null) {
  const validation = validateImageFile(file);
  if (!validation.ok) return false;

  const imageId = crypto.randomUUID();
  const path = `home-banners/${context.userId}/${entityId || "draft"}/${imageId}.${validation.extension}`;
  const { error: uploadError } = await context.supabase.storage.from("home-banner-images").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) return false;

  const { data: publicUrlData } = context.supabase.storage.from("home-banner-images").getPublicUrl(path);
  const { data, error } = await context.supabase
    .from("image_assets")
    .insert({
      source_type: "storage",
      bucket: "home-banner-images",
      path,
      public_url: publicUrlData.publicUrl,
      owner_id: context.userId,
      entity_type: "home_banner",
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

async function markImageAssetDeleted(supabase: SupabaseServerClient, imageAssetId: string) {
  await supabase
    .from("image_assets")
    .update({ status: "deleted", deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", imageAssetId);
}

function validateImageFile(file: File): { ok: true; extension: "jpg" | "png" | "webp" } | { ok: false } {
  if (!file || file.size <= 0 || file.size > 5 * 1024 * 1024) return { ok: false };
  if (file.type === "image/jpeg") return { ok: true, extension: "jpg" };
  if (file.type === "image/png") return { ok: true, extension: "png" };
  if (file.type === "image/webp") return { ok: true, extension: "webp" };
  return { ok: false };
}

async function hasPermission(supabase: SupabaseServerClient, permissionKey: string) {
  void supabase;
  return hasAdminModulePermission(moduleForPermission(permissionKey), permissionKey);
}

function moduleForPermission(permissionKey: string) {
  return permissionKey === "manage_top_links" ? "navigation" : "home";
}

async function getDefaultCityId(supabase: SupabaseServerClient) {
  const { data } = await supabase.from("cities").select("id").eq("slug", "ny").maybeSingle();
  return data?.id ?? null;
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function readNextManualTickerSortOrder(supabase: SupabaseServerClient): Promise<{ ok: true; value: number } | { ok: false; message: string }> {
  const { data, error } = await supabase
    .from("latest_ticker")
    .select("sort_order")
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) return { ok: false, message: "读取手动动态排序失败。" };
  const firstSortOrder = typeof data?.sort_order === "number" ? data.sort_order : 10;
  return { ok: true, value: firstSortOrder - 10 };
}

async function moveLatestTickerItem(context: Extract<AdminActionContext, { ok: true }>, id: string, direction: "up" | "down"): Promise<AdminHomeActionState> {
  const { data, error } = await context.supabase
    .from("latest_ticker")
    .select("id,sort_order,title")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) return fail("读取手动动态排序失败。");

  const items = data.map((item, index) => ({ id: item.id, sort_order: (index + 1) * 10 }));
  const currentIndex = items.findIndex((item) => item.id === id);
  if (currentIndex < 0) return fail("手动动态不存在。");

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= items.length) return fail(direction === "up" ? "这条动态已经在最前面。" : "这条动态已经在最后面。");

  const currentOrder = items[currentIndex].sort_order;
  items[currentIndex].sort_order = items[targetIndex].sort_order;
  items[targetIndex].sort_order = currentOrder;

  const updates = await Promise.all(
    items.map((item) =>
      context.supabase
        .from("latest_ticker")
        .update({ sort_order: item.sort_order, updated_at: new Date().toISOString() })
        .eq("id", item.id),
    ),
  );
  if (updates.some((result) => result.error)) return fail("手动动态排序保存失败。");
  if (!(await auditLog(context, "move_latest_ticker", "latest_ticker", id, { direction }))) return auditFailure();

  revalidateAdminHome();
  return ok("手动动态排序已更新。");
}

function moveTickerSectionPayloads<T extends { section_key: string; sort_order: number }>(payloads: T[], sectionKey: string, direction: "up" | "down"): { ok: true } | { ok: false; message: string } {
  const sorted = payloads
    .map((payload, index) => ({ ...payload, sort_order: Number.isFinite(payload.sort_order) ? payload.sort_order : (index + 1) * 10 }))
    .sort((a, b) => a.sort_order - b.sort_order);
  const currentIndex = sorted.findIndex((payload) => payload.section_key === sectionKey);
  if (currentIndex < 0) return { ok: false, message: "自动动态分类不存在。" };

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= sorted.length) {
    return { ok: false, message: direction === "up" ? "这个分类已经在最前面。" : "这个分类已经在最后面。" };
  }

  const currentOrder = sorted[currentIndex].sort_order;
  sorted[currentIndex].sort_order = sorted[targetIndex].sort_order;
  sorted[targetIndex].sort_order = currentOrder;
  sorted.sort((a, b) => a.sort_order - b.sort_order).forEach((payload, index) => {
    payload.sort_order = (index + 1) * 10;
  });

  for (const moved of sorted) {
    const original = payloads.find((payload) => payload.section_key === moved.section_key);
    if (original) original.sort_order = moved.sort_order;
  }

  return { ok: true };
}

function readFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
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

function readIntegerInRange(formData: FormData, key: string, label: string, min: number, max: number): { ok: true; value: number } | { ok: false; message: string } {
  const value = readInteger(formData, key, label);
  if (!value.ok) return value;
  if (value.value < min || value.value > max) return { ok: false, message: `${label} 必须在 ${min} 到 ${max} 之间。` };
  return value;
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

function titleFromUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed.split("/").filter(Boolean).at(-1) || "导航";
  }

  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    const hostname = url.hostname.replace(/^www\./, "");
    return hostname.split(".")[0] || "";
  } catch {
    return "";
  }
}

function revalidateAdminHome() {
  revalidatePath("/");
  revalidatePath("/admin/home");
  revalidatePath("/admin/home-config");
  revalidatePath("/admin/navigation");
  revalidatePath("/admin/top-links");
}
