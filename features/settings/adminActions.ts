"use server";

import { revalidatePath } from "next/cache";
import type { AdminHomeActionState } from "@/features/admin-home/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DAILY_POST_LIMIT_KEY, normalizeDailyPostLimit } from "./adminQueries";
import {
  emptyPlaceholderImageValue,
  isDefaultPlaceholderImageKey,
  normalizePlaceholderImageValue,
  type DefaultPlaceholderImageValue,
} from "./defaultPlaceholderImages";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

type AdminSettingsActionContext =
  | { ok: false; message: string }
  | { ok: true; supabase: SupabaseServerClient; userId: string };

const ok = (message: string): AdminHomeActionState => ({ ok: true, message });
const fail = (message: string): AdminHomeActionState => ({ ok: false, message });

export async function updateDailyPostLimit(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getAdminSettingsActionContext();
  if (!context.ok) return fail(context.message);

  const rawLimit = formData.get("daily_post_limit");
  const parsedLimit = typeof rawLimit === "string" ? Number(rawLimit) : Number.NaN;
  if (!Number.isFinite(parsedLimit) || parsedLimit < 1 || parsedLimit > 100 || !Number.isInteger(parsedLimit)) {
    return fail("请输入 1~100 之间的整数。");
  }

  const before = await readSiteSetting(context.supabase, DAILY_POST_LIMIT_KEY);
  const payload = {
    key: DAILY_POST_LIMIT_KEY,
    value: { dailyPostLimit: parsedLimit },
    description: "每个账号每天最多可发布的信息总数。",
    is_public: false,
    updated_by: context.userId,
    updated_at: new Date().toISOString(),
  };

  const { error } = await context.supabase.from("site_settings").upsert(payload, { onConflict: "key" });
  if (error) return fail("每日发布上限保存失败，请稍后再试。");

  const audited = await writeAuditLog(context, "update_site_setting", DAILY_POST_LIMIT_KEY, before, payload);
  if (!audited) return fail("设置已保存，但审计日志写入失败，请联系管理员检查 admin_audit_logs。");

  revalidatePath("/admin/settings");
  return ok(`每日发布上限已保存为 ${parsedLimit} 条。`);
}

export async function updateDefaultPlaceholderImage(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getAdminSettingsActionContext();
  if (!context.ok) return fail(context.message);

  const key = readText(formData, "setting_key");
  if (!isDefaultPlaceholderImageKey(key)) return fail("默认占位图片设置项不正确。");

  const removeImage = formData.get("remove_image") === "on";
  if (removeImage && formData.get("confirm_remove_image") !== "on") {
    return fail("请先勾选确认清除默认占位图片。");
  }
  const imageFile = readFile(formData, "image_file");
  const imageUrl = normalizeImageUrl(readText(formData, "image_url"));
  if (!imageUrl.ok) return fail(imageUrl.message);

  if (!removeImage && !imageFile && !imageUrl.value) {
    return fail("请上传图片，或填写 https://img.openaa.com/ 图片链接。");
  }

  const before = await readSiteSetting(context.supabase, key);
  const beforeValue = normalizePlaceholderImageValue((before as { value?: unknown } | null)?.value);
  let nextValue: DefaultPlaceholderImageValue = emptyPlaceholderImageValue();

  if (!removeImage) {
    const imageAsset = imageFile
      ? await uploadPlaceholderImageAsset(context, imageFile, key)
      : imageUrl.value
        ? await upsertExternalImageAsset(context, imageUrl.value, key)
        : false;

    if (imageAsset === false) {
      return fail("图片保存失败，请确认上传的是 5MB 以内的 JPG、PNG、WebP，或填写 https://img.openaa.com/ 地址。");
    }

    nextValue = {
      url: imageAsset.url,
      imageAssetId: imageAsset.id,
      sourceType: imageAsset.sourceType,
    };
  }

  const payload = {
    key,
    value: nextValue,
    description: key === "default_marketplace_placeholder_image"
      ? "二手信息没有用户上传图片时使用的默认占位图片。"
      : "本地服务信息没有用户上传图片时使用的默认占位图片。",
    is_public: true,
    updated_by: context.userId,
    updated_at: new Date().toISOString(),
  };

  const { error } = await context.supabase.from("site_settings").upsert(payload, { onConflict: "key" });
  if (error) {
    logSupabaseError("save default placeholder site setting failed", error, { key });
    return fail("默认占位图片保存失败，请稍后再试。");
  }

  if (beforeValue.imageAssetId && beforeValue.imageAssetId !== nextValue.imageAssetId) {
    await markImageAssetDeleted(context.supabase, beforeValue.imageAssetId);
  }

  const audited = await writeAuditLog(context, "update_default_placeholder_image", key, before, payload);
  if (!audited) return fail("设置已保存，但审计日志写入失败，请联系管理员检查 admin_audit_logs。");

  revalidatePath("/admin/settings");
  revalidatePath("/secondhand");
  revalidatePath("/services");
  revalidatePath("/");
  return ok(removeImage ? "默认占位图片已清除。" : "默认占位图片已保存。");
}

async function getAdminSettingsActionContext(): Promise<AdminSettingsActionContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Supabase 环境变量未配置，暂时无法保存站点设置。" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "请先登录管理员账号。" };

  const { data: allowed, error } = await supabase.rpc("has_admin_permission", {
    p_permission_key: "manage_settings",
  });
  if (error || !allowed) return { ok: false, message: "当前账号没有 manage_settings 权限。" };

  return { ok: true, supabase, userId: user.id };
}

async function readSiteSetting(supabase: SupabaseServerClient, key: string) {
  const { data } = await supabase
    .from("site_settings")
    .select("key,value,description,is_public,updated_by,created_at,updated_at")
    .eq("key", key)
    .maybeSingle();

  if (!data) return null;
  return {
    ...data,
    normalized_daily_post_limit: normalizeDailyPostLimit((data as { value?: unknown }).value),
  };
}

async function upsertExternalImageAsset(context: Extract<AdminSettingsActionContext, { ok: true }>, imageUrl: string, entityId: string) {
  try {
    const externalHost = new URL(imageUrl).hostname.toLowerCase();
    const { data, error } = await context.supabase
      .from("image_assets")
      .insert({
        source_type: "external",
        external_url: imageUrl,
        external_host: externalHost,
        owner_id: context.userId,
        entity_type: "site_setting",
        entity_id: entityId,
        status: "active",
        is_public: true,
      })
      .select("id")
      .single();

    if (error || !data) {
      logSupabaseError("create external placeholder image asset failed", error, { entityId, imageUrl });
      return false;
    }
    return { id: data.id as string, url: imageUrl, sourceType: "external" as const };
  } catch (error) {
    console.error("[settings] create external placeholder image asset failed", { entityId, imageUrl, error });
    return false;
  }
}

async function uploadPlaceholderImageAsset(context: Extract<AdminSettingsActionContext, { ok: true }>, file: File, entityId: string) {
  const validation = validateImageFile(file);
  if (!validation.ok) return false;

  const imageId = crypto.randomUUID();
  const path = `post-placeholders/${entityId}/${context.userId}/${imageId}.${validation.extension}`;
  const { error: uploadError } = await context.supabase.storage.from("site-setting-images").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) {
    logSupabaseError("upload placeholder image to storage failed", uploadError, { bucket: "site-setting-images", path, entityId, fileType: file.type, fileSize: file.size });
    return false;
  }

  const { data: publicUrlData } = context.supabase.storage.from("site-setting-images").getPublicUrl(path);
  const { data, error } = await context.supabase
    .from("image_assets")
    .insert({
      source_type: "storage",
      bucket: "site-setting-images",
      path,
      public_url: publicUrlData.publicUrl,
      owner_id: context.userId,
      entity_type: "site_setting",
      entity_id: entityId,
      mime_type: file.type,
      size_bytes: file.size,
      status: "active",
      is_public: true,
    })
    .select("id")
    .single();

  if (error || !data) {
    logSupabaseError("create storage placeholder image asset failed", error, { bucket: "site-setting-images", path, entityId });
    return false;
  }
  return { id: data.id as string, url: publicUrlData.publicUrl, sourceType: "storage" as const };
}

async function markImageAssetDeleted(supabase: SupabaseServerClient, imageAssetId: string) {
  const { error } = await supabase
    .from("image_assets")
    .update({ status: "deleted", deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", imageAssetId);
  if (error) logSupabaseError("mark old placeholder image asset deleted failed", error, { imageAssetId });
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

function validateImageFile(file: File): { ok: true; extension: "jpg" | "png" | "webp" } | { ok: false } {
  if (!file || file.size <= 0 || file.size > 5 * 1024 * 1024) return { ok: false };
  if (file.type === "image/jpeg") return { ok: true, extension: "jpg" };
  if (file.type === "image/png") return { ok: true, extension: "png" };
  if (file.type === "image/webp") return { ok: true, extension: "webp" };
  return { ok: false };
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

function logSupabaseError(scope: string, error: unknown, metadata?: Record<string, unknown>) {
  if (!error) {
    console.error(`[settings] ${scope}`, { ...metadata, error: "No data returned" });
    return;
  }

  const candidate = error as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown };
  console.error(`[settings] ${scope}`, {
    code: candidate.code,
    message: candidate.message,
    details: candidate.details,
    hint: candidate.hint,
    ...metadata,
  });
}

async function writeAuditLog(
  context: Extract<AdminSettingsActionContext, { ok: true }>,
  action: string,
  entityId: string,
  beforeData: unknown,
  afterData: unknown,
) {
  const { error } = await context.supabase.from("admin_audit_logs").insert({
    actor_id: context.userId,
    action,
    entity_type: "site_settings",
    entity_id: entityId,
    before_data: beforeData ?? null,
    after_data: afterData ?? null,
  });

  return !error;
}
