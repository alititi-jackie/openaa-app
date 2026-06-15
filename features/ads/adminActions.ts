"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasAdminModulePermission } from "@/lib/permissions/admin";
import { writeAdminAuditLog } from "@/lib/permissions/adminAuditLog";
import type { AdminHomeActionState } from "@/features/admin-home/types";

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

export async function upsertAd(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getAdminActionContext();
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  const placement = normalizePlacement(readText(formData, "placement"));
  const title = readText(formData, "title");
  const href = normalizeOptionalLink(readText(formData, "href"));
  const openMode = readText(formData, "open_mode") === "new" ? "new" : "same";
  const imageUrl = normalizeImageUrl(readText(formData, "image_url"));
  const imageFile = readFile(formData, "image_file");
  const sortOrder = readInteger(formData, "sort_order", "排序");
  const isActive = formData.get("is_active") === "on";
  const startsAt = readDateTime(formData, "starts_at");
  const endsAt = readDateTime(formData, "ends_at");

  if (!placement) return fail("广告位置不能为空。");
  if (!title) return fail("广告标题不能为空。");
  if (!href.ok) return fail(href.message);
  if (!imageUrl.ok) return fail(imageUrl.message);
  if (!sortOrder.ok) return fail(sortOrder.message);
  if (!id && !imageUrl.value && !imageFile) return fail("新增广告需要上传广告图片或填写 https://img.openaa.com/ 图片 URL。");

  const before = id ? await readAd(context.supabase, id) : null;
  const imageAssetId = imageFile
    ? await uploadAdImageAsset(context, imageFile, id || null)
    : imageUrl.value
      ? await upsertExternalImageAsset(context, imageUrl.value, id || null)
      : readText(formData, "image_asset_id") || null;
  if (imageAssetId === false) return fail("图片保存失败，请确认上传的是 5MB 以内的 JPG、PNG、WebP，或填写 https://img.openaa.com/ 地址。");

  const payload = {
    placement,
    title,
    href: href.value,
    open_mode: openMode,
    image_asset_id: imageAssetId,
    is_active: isActive,
    sort_order: sortOrder.value,
    starts_at: startsAt,
    ends_at: endsAt,
    updated_at: new Date().toISOString(),
  };

  const result = id ? await context.supabase.from("ads").update(payload).eq("id", id).select("id").single() : await context.supabase.from("ads").insert(payload).select("id").single();

  if (result.error || !result.data) return fail("广告保存失败。");

  if (imageAssetId && !id) {
    await context.supabase.from("image_assets").update({ entity_id: result.data.id }).eq("id", imageAssetId).eq("owner_id", context.userId);
  }

  if (imageAssetId && before?.image_asset_id && before.image_asset_id !== imageAssetId) {
    await context.supabase
      .from("image_assets")
      .update({ status: "deleted", deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", before.image_asset_id);
  }

  const audited = await auditLog(context, id ? "update_ad" : "create_ad", "ads", result.data.id, before, payload);
  if (!audited) return auditFailure();

  revalidateAds();
  return ok("广告已保存。");
}

export async function deleteAd(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getAdminActionContext();
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  if (!id) return fail("缺少广告 ID。");
  if (formData.get("confirm_delete") !== "on") return fail("请先勾选确认删除。");

  const before = await readAd(context.supabase, id);
  if (!before) return fail("广告不存在或已删除。");

  const result = await context.supabase.from("ads").delete().eq("id", id);
  if (result.error) return fail("广告删除失败。");

  const audited = await auditLog(context, "delete_ad", "ads", id, before, null);
  if (!audited) return auditFailure();

  revalidateAds();
  return ok("广告已删除。");
}

export async function removeAdImage(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getAdminActionContext();
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  if (!id) return fail("缺少广告 ID。");
  if (formData.get("confirm_remove_image") !== "on") return fail("请先勾选确认移除图片。");

  const before = await readAd(context.supabase, id);
  if (!before) return fail("广告不存在或已删除。");
  if (!before.image_asset_id) return fail("这条广告没有可移除的图片。");

  const result = await context.supabase.from("ads").update({ image_asset_id: null, updated_at: new Date().toISOString() }).eq("id", id);
  if (result.error) return fail("广告图片移除失败。");

  await context.supabase
    .from("image_assets")
    .update({ status: "deleted", deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", before.image_asset_id);

  const audited = await auditLog(context, "remove_ad_image", "ads", id, before, { image_asset_id: null });
  if (!audited) return auditFailure();

  revalidateAds();
  return ok("广告图片已移除。");
}

async function getAdminActionContext(): Promise<AdminActionContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Supabase 环境变量未配置，暂时无法保存广告。" };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, message: "请先登录管理员账号。" };

  if (!(await hasAdminModulePermission("ads", "manage_ads"))) {
    return { ok: false, message: "当前账号没有广告管理模块权限。" };
  }

  return { ok: true, supabase, userId: user.id };
}

async function readAd(supabase: SupabaseServerClient, id: string) {
  const { data } = await supabase.from("ads").select("id,placement,title,href,open_mode,image_asset_id,is_active,sort_order,starts_at,ends_at").eq("id", id).maybeSingle();
  return data ?? null;
}

async function auditLog(context: Extract<AdminActionContext, { ok: true }>, action: string, entityType: string, entityId: string | null, beforeData?: unknown, afterData?: unknown) {
  return writeAdminAuditLog({
    actorId: context.userId,
    action,
    entityType,
    entityId,
    beforeData,
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
        entity_type: "ad",
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

async function uploadAdImageAsset(context: Extract<AdminActionContext, { ok: true }>, file: File, entityId: string | null) {
  const validation = validateImageFile(file);
  if (!validation.ok) return false;

  const imageId = crypto.randomUUID();
  const path = `ads/${context.userId}/${entityId || "draft"}/${imageId}.${validation.extension}`;
  const { error: uploadError } = await context.supabase.storage.from("ad-images").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) return false;

  const { data: publicUrlData } = context.supabase.storage.from("ad-images").getPublicUrl(path);
  const { data, error } = await context.supabase
    .from("image_assets")
    .insert({
      source_type: "storage",
      bucket: "ad-images",
      path,
      public_url: publicUrlData.publicUrl,
      owner_id: context.userId,
      entity_type: "ad",
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

function validateImageFile(file: File): { ok: true; extension: "jpg" | "png" | "webp" } | { ok: false } {
  if (!file || file.size <= 0 || file.size > 5 * 1024 * 1024) return { ok: false };
  if (file.type === "image/jpeg") return { ok: true, extension: "jpg" };
  if (file.type === "image/png") return { ok: true, extension: "png" };
  if (file.type === "image/webp") return { ok: true, extension: "webp" };
  return { ok: false };
}

function normalizePlacement(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80);
}

function normalizeOptionalLink(raw: string): { ok: true; value: string | null } | { ok: false; message: string } {
  if (!raw) return { ok: true, value: null };
  if (raw.startsWith("/") && !raw.startsWith("//")) {
    if (raw.slice(1) === "marketplace") return { ok: false, message: "请使用 /secondhand 作为二手频道路径。" };
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

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
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

function readDateTime(formData: FormData, key: string) {
  const raw = readText(formData, key);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function revalidateAds() {
  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath("/housing");
  revalidatePath("/secondhand");
  revalidatePath("/services");
  revalidatePath("/news");
  revalidatePath("/navigation");
  revalidatePath("/dmv");
  revalidatePath("/admin/ads");
}
