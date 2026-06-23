"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasAdminModulePermission } from "@/lib/permissions/admin";
import { writeAdminAuditLog } from "@/lib/permissions/adminAuditLog";
import type { AdminHomeActionState } from "@/features/admin-home/types";
import { adPositions, normalizeAdPosition, type AdOpenMode } from "./types";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
type AdminActionContext =
  | { ok: false; message: string }
  | {
      ok: true;
      supabase: SupabaseServerClient;
      userId: string;
    };

type ExistingAd = {
  id: string;
  placement: string;
  href: string | null;
  image_asset_id: string | null;
  link_type: string | null;
  external_url: string | null;
  slug: string | null;
  content: string | null;
  contact_name: string | null;
  phone: string | null;
  wechat: string | null;
  address: string | null;
  open_mode: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  sort_order: number;
};

const ok = (message: string): AdminHomeActionState => ({ ok: true, message });
const fail = (message: string): AdminHomeActionState => ({ ok: false, message });
const slugRegex = /^[a-z0-9-]+$/;

export async function upsertAd(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getAdminActionContext();
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  const position = normalizeAdPosition(readText(formData, "position"));
  const openMode = normalizeOpenMode(readText(formData, "open_mode"));
  const imageUrl = readText(formData, "image_url");
  const imageFile = readFile(formData, "image_file");
  const existingImageAssetId = readText(formData, "image_asset_id") || null;
  const isActiveValue = formData.get("is_active");
  const isActive = isActiveValue === "on" || isActiveValue === "true";
  const startsAt = readAdDate(formData, "start_date", "start");
  const endsAt = readAdDate(formData, "end_date", "end");
  const before = id ? await readAd(context.supabase, id) : null;

  if (!position) return fail("请选择广告位置。");
  if (!openMode) return fail("请选择打开方式。");
  if (imageFile && imageUrl) return fail("上传图片和外部图片链接只能二选一。");
  if (!id && !imageFile && !imageUrl) return fail("请上传广告图片或填写外部图片链接。");
  if (startsAt && endsAt && new Date(startsAt).getTime() > new Date(endsAt).getTime()) return fail("开始日期不能晚于结束日期。");

  const imageAssetId = await resolveImageAsset(context, {
    imageFile,
    imageUrl,
    existingImageAssetId,
    entityId: id || null,
  });
  if (imageAssetId === false) return fail("图片保存失败，请确认图片格式或链接。");

  const normalized = normalizeAdPayload(formData, openMode, position, imageAssetId, isActive, startsAt, endsAt);
  if (!normalized.ok) return fail(normalized.message);

  if (normalized.payload.link_type === "internal" && normalized.payload.slug) {
    const hasConflict = await hasInternalSlugConflict(context.supabase, normalized.payload.slug, id || null);
    if (hasConflict) return fail("这个广告 slug 已存在，请换一个。");
  }

  const payload = normalized.payload as Record<string, unknown>;
  const result = id
    ? await context.supabase.from("ads").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", id).is("deleted_at", null).select("id").single()
    : await context.supabase.from("ads").insert(payload).select("id").single();

  if (result.error || !result.data) return fail(id ? "更新失败。" : "创建失败。");

  if (imageAssetId && !id) {
    await context.supabase.from("image_assets").update({ entity_id: result.data.id }).eq("id", imageAssetId).eq("owner_id", context.userId);
  }

  if (imageAssetId && before?.image_asset_id && before.image_asset_id !== imageAssetId) {
    await markImageAssetDeleted(context.supabase, before.image_asset_id);
  }

  const audited = await auditLog(context, id ? "update_ad" : "create_ad", result.data.id, before, payload);
  if (!audited) return fail("广告已保存，但审计日志写入失败，请联系管理员检查 admin_audit_logs。");

  revalidateAds();
  return ok(id ? "更新成功" : "创建成功");
}

export async function toggleAdActive(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getAdminActionContext();
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  const nextActive = readText(formData, "next_active") === "true";
  const before = await readAd(context.supabase, id);
  if (!before) return fail("广告不存在或已删除。");

  const { error } = await context.supabase.from("ads").update({ is_active: nextActive, updated_at: new Date().toISOString() }).eq("id", id).is("deleted_at", null);
  if (error) return fail("更新失败。");

  const audited = await auditLog(context, "toggle_ad_active", id, before, { is_active: nextActive });
  if (!audited) return fail("状态已更新，但审计日志写入失败。");

  revalidateAds();
  return ok(nextActive ? "已启用" : "已停用");
}

export async function deleteAd(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getAdminActionContext();
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  const before = await readAd(context.supabase, id);
  if (!before) return fail("广告不存在或已删除。");

  const now = new Date().toISOString();
  const { error } = await context.supabase.from("ads").update({ deleted_at: now, deleted_by: context.userId, updated_at: now }).eq("id", id).is("deleted_at", null);
  if (error) return fail("删除失败。");

  const audited = await auditLog(context, "soft_delete_ad", id, before, { deleted_at: now });
  if (!audited) return fail("广告已删除，但审计日志写入失败。");

  revalidateAds();
  return ok("广告已删除。");
}

export async function removeAdImage(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getAdminActionContext();
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  const before = await readAd(context.supabase, id);
  if (!before) return fail("广告不存在或已删除。");
  if (!before.image_asset_id) return fail("这条广告没有可删除的图片。");

  const { error } = await context.supabase.from("ads").update({ image_asset_id: null, updated_at: new Date().toISOString() }).eq("id", id).is("deleted_at", null);
  if (error) return fail("删除图片失败。");

  await markImageAssetDeleted(context.supabase, before.image_asset_id);
  const audited = await auditLog(context, "remove_ad_image", id, before, { image_asset_id: null });
  if (!audited) return fail("图片已删除，但审计日志写入失败。");

  revalidateAds();
  return ok("图片已删除，可以重新上传或填写外部链接。");
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

function normalizeAdPayload(formData: FormData, openMode: AdOpenMode, position: NonNullable<ReturnType<typeof normalizeAdPosition>>, imageAssetId: string | null, isActive: boolean, startsAt: string | null, endsAt: string | null) {
  const title = readText(formData, "title");
  const externalUrl = readText(formData, "external_url");
  const slug = normalizeAdSlug(readText(formData, "slug"));
  const content = readText(formData, "content") || null;
  const contactName = readText(formData, "contact_name") || null;
  const phone = readText(formData, "phone") || null;
  const wechat = readText(formData, "wechat") || null;
  const address = readText(formData, "address") || null;

  if (!imageAssetId) return { ok: false as const, message: "请上传广告图片或填写外部图片链接。" };
  if (!title) return { ok: false as const, message: "请填写广告标题。" };

  if (openMode === "internal") {
    if (!slug || !slugRegex.test(slug)) return { ok: false as const, message: "内部广告必须填写有效 slug，只能使用小写字母、数字和短横线。" };
    return {
      ok: true as const,
      payload: {
        placement: position,
        title,
        href: `/ads/${slug}`,
        image_asset_id: imageAssetId,
        link_type: "internal",
        external_url: null,
        slug,
        content,
        contact_name: contactName,
        phone,
        wechat,
        address,
        open_mode: "internal",
        is_active: isActive,
        starts_at: startsAt,
        ends_at: endsAt,
        sort_order: readInteger(formData, "sort_order"),
      },
    };
  }

  if (!isHttpUrl(externalUrl)) return { ok: false as const, message: "外部广告必须填写有效链接地址。" };
  return {
    ok: true as const,
    payload: {
      placement: position,
      title,
      href: externalUrl,
      image_asset_id: imageAssetId,
      link_type: "external",
      external_url: externalUrl,
      slug: null,
      content: null,
      contact_name: null,
      phone: null,
      wechat: null,
      address: null,
      open_mode: openMode,
      is_active: isActive,
      starts_at: startsAt,
      ends_at: endsAt,
      sort_order: readInteger(formData, "sort_order"),
    },
  };
}

async function resolveImageAsset(context: Extract<AdminActionContext, { ok: true }>, input: { imageFile: File | null; imageUrl: string; existingImageAssetId: string | null; entityId: string | null }) {
  if (input.imageFile) return uploadAdImageAsset(context, input.imageFile, input.entityId);
  if (input.imageUrl) return upsertExternalImageAsset(context, input.imageUrl, input.entityId);
  return input.existingImageAssetId;
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

async function upsertExternalImageAsset(context: Extract<AdminActionContext, { ok: true }>, imageUrl: string, entityId: string | null) {
  if (!isHttpsUrl(imageUrl)) return false;
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

async function readAd(supabase: SupabaseServerClient, id: string): Promise<ExistingAd | null> {
  if (!id) return null;
  const { data } = await supabase
    .from("ads")
    .select("id,placement,href,image_asset_id,link_type,external_url,slug,content,contact_name,phone,wechat,address,open_mode,is_active,starts_at,ends_at,sort_order")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  return (data as ExistingAd | null) ?? null;
}

async function hasInternalSlugConflict(supabase: SupabaseServerClient, slug: string, currentId: string | null) {
  let query = supabase.from("ads").select("id").eq("link_type", "internal").eq("slug", slug).is("deleted_at", null).limit(1);
  if (currentId) query = query.neq("id", currentId);
  const { data, error } = await query;
  if (error) return true;
  return Boolean(data?.length);
}

async function markImageAssetDeleted(supabase: SupabaseServerClient, imageAssetId: string) {
  await supabase
    .from("image_assets")
    .update({ status: "deleted", deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", imageAssetId);
}

async function auditLog(context: Extract<AdminActionContext, { ok: true }>, action: string, entityId: string, beforeData?: unknown, afterData?: unknown) {
  return writeAdminAuditLog({
    actorId: context.userId,
    action,
    entityType: "ads",
    entityId,
    beforeData,
    afterData,
  });
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

function readAdDate(formData: FormData, key: string, boundary: "start" | "end") {
  const raw = readText(formData, key);
  if (!raw) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]) + (boundary === "end" ? 1 : 0);
  return zonedMidnightToUtcIso(year, month, day, "America/New_York");
}

function zonedMidnightToUtcIso(year: number, month: number, day: number, timeZone: string) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const firstPass = new Date(utcGuess.getTime() - getTimeZoneOffsetMs(utcGuess, timeZone));
  const secondPass = new Date(utcGuess.getTime() - getTimeZoneOffsetMs(firstPass, timeZone));
  return secondPass.toISOString();
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const asUtc = Date.UTC(value("year"), value("month") - 1, value("day"), value("hour"), value("minute"), value("second"));
  return asUtc - date.getTime();
}

function readInteger(formData: FormData, key: string) {
  const value = Number(readText(formData, key));
  return Number.isInteger(value) ? value : 0;
}

function normalizeOpenMode(value: string): AdOpenMode | null {
  if (value === "internal" || value === "external_new" || value === "external_same") return value;
  return null;
}

function normalizeAdSlug(value: string) {
  return value.trim().toLowerCase();
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function validateImageFile(file: File): { ok: true; extension: "jpg" | "png" | "webp" } | { ok: false } {
  if (!file || file.size <= 0 || file.size > 5 * 1024 * 1024) return { ok: false };
  if (file.type === "image/jpeg") return { ok: true, extension: "jpg" };
  if (file.type === "image/png") return { ok: true, extension: "png" };
  if (file.type === "image/webp") return { ok: true, extension: "webp" };
  return { ok: false };
}

function revalidateAds() {
  for (const position of adPositions) {
    revalidatePath(`/admin/ads?position=${position.key}`);
  }
  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath("/housing");
  revalidatePath("/marketplace");
  revalidatePath("/services");
  revalidatePath("/news");
  revalidatePath("/navigation");
  revalidatePath("/dmv");
  revalidatePath("/admin/ads");
}
