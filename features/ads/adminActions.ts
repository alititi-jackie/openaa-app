"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
  const sortOrder = readInteger(formData, "sort_order", "排序");
  const isActive = formData.get("is_active") === "on";
  const startsAt = readDateTime(formData, "starts_at");
  const endsAt = readDateTime(formData, "ends_at");

  if (!placement) return fail("广告位置不能为空。");
  if (!title) return fail("广告标题不能为空。");
  if (!href.ok) return fail(href.message);
  if (!imageUrl.ok) return fail(imageUrl.message);
  if (!sortOrder.ok) return fail(sortOrder.message);
  if (!id && !imageUrl.value) return fail("新增广告需要填写 https://img.openaa.com/ 图片 URL。");

  const before = id ? await readAd(context.supabase, id) : null;
  const imageAssetId = imageUrl.value ? await upsertExternalImageAsset(context, imageUrl.value, id || null) : readText(formData, "image_asset_id") || null;
  if (imageAssetId === false) return fail("图片 URL 保存失败，请确认地址为 https://img.openaa.com/ 开头。");

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

  const audited = await auditLog(context, id ? "update_ad" : "create_ad", "ads", result.data.id, before, payload);
  if (!audited) return auditFailure();

  revalidateAds();
  return ok("广告已保存。");
}

async function getAdminActionContext(): Promise<AdminActionContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Supabase 环境变量未配置，暂时无法保存广告。" };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, message: "请先登录管理员账号。" };

  const { data: allowed } = await supabase.rpc("has_admin_permission", { p_permission_key: "manage_ads" });
  if (!allowed) return { ok: false, message: "当前账号没有 manage_ads 权限。" };

  return { ok: true, supabase, userId: user.id };
}

async function readAd(supabase: SupabaseServerClient, id: string) {
  const { data } = await supabase.from("ads").select("id,placement,title,href,open_mode,image_asset_id,is_active,sort_order,starts_at,ends_at").eq("id", id).maybeSingle();
  return data ?? null;
}

async function auditLog(context: Extract<AdminActionContext, { ok: true }>, action: string, entityType: string, entityId: string | null, beforeData?: unknown, afterData?: unknown) {
  const { error } = await context.supabase.from("admin_audit_logs").insert({
    actor_id: context.userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    before_data: beforeData ?? null,
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

function normalizePlacement(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80);
}

function normalizeOptionalLink(raw: string): { ok: true; value: string | null } | { ok: false; message: string } {
  if (!raw) return { ok: true, value: null };
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
  revalidatePath("/marketplace");
  revalidatePath("/services");
  revalidatePath("/news");
  revalidatePath("/navigation");
  revalidatePath("/dmv");
  revalidatePath("/admin/ads");
}
