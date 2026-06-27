"use server";

import { revalidatePath } from "next/cache";
import type { AdminHomeActionState } from "@/features/admin-home/types";
import { getImageAssetBusinessReferenceMap } from "@/features/image-cleanup/referenceGuards";
import { hasAdminModulePermission } from "@/lib/permissions/admin";
import { writeAdminAuditLog } from "@/lib/permissions/adminAuditLog";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

type ImageCleanupActionContext =
  | { ok: false; message: string }
  | { ok: true; supabase: SupabaseServerClient; userId: string };

type ImagePurgeActionContext =
  | { ok: false; message: string }
  | { ok: true; supabase: ReturnType<typeof createSupabaseAdminClient>; userId: string };

const ok = (message: string): AdminHomeActionState => ({ ok: true, message });
const fail = (message: string): AdminHomeActionState => ({ ok: false, message });

export async function markImageAssetDeleted(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const id = readText(formData, "id");
  if (!id) return fail("图片资产参数无效。");
  if (formData.get("confirm_cleanup") !== "on") return fail("请先勾选确认清理图片资产。");

  const context = await getImageCleanupActionContext();
  if (!context.ok) return fail(context.message);

  const before = await readImageAsset(context.supabase, id);
  if (!before) return fail("图片资产不存在或无权读取。");
  if (before.status === "deleted") return fail("这张图片已经标记为已删除。");
  if (before.entity_id) return fail("该图片仍被使用，不能清理。");
  if (await isImageAssetStillReferenced(context.supabase, before)) return fail("该图片仍被使用，不能清理。");

  const payload = {
    status: "deleted",
    deleted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {
      ...(isRecord(before.metadata) ? before.metadata : {}),
      cleanup: {
        marked_by: context.userId,
        marked_at: new Date().toISOString(),
        mode: "admin_image_cleanup",
        physical_delete: false,
      },
    },
  };

  const { error } = await context.supabase.from("image_assets").update(payload).eq("id", id);
  if (error) return fail("图片资产删除标记失败，请稍后再试。");

  const audited = await writeAuditLog(context, "mark_image_asset_deleted", id, before, payload);
  if (!audited) return fail("图片已标记删除，但审计日志写入失败，请联系管理员检查 admin_audit_logs。");

  revalidatePath("/admin/image-cleanup");
  return ok("图片资产已标记为已删除。");
}

export async function purgeDeletedImageAsset(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const id = readText(formData, "id");
  if (!id) return fail("图片资产参数无效。");
  if (formData.get("confirm_purge_image") !== "on") return fail("请先确认彻底清理图片。");

  const context = await getImagePurgeActionContext();
  if (!context.ok) return fail(context.message);

  const before = await readImageAsset(context.supabase, id);
  if (!before) return fail("图片资产不存在或无权读取。");
  if (before.status !== "deleted") return fail("只有已标记删除的图片可以彻底清理。");
  if (before.source_type !== "storage") return fail("外部图片没有本站 Storage 文件，不需要物理删除。");
  if (!before.bucket || !before.path) return fail("图片缺少 Storage 路径，无法物理删除。");
  if (await isImageAssetStillReferenced(context.supabase, before)) return fail("这张图片仍被业务使用，不能彻底清理。");

  const { error: storageError } = await context.supabase.storage.from(before.bucket).remove([before.path]);
  if (storageError) return fail(`Storage 文件删除失败：${storageError.message}`);

  const { error } = await context.supabase.from("image_assets").delete().eq("id", id).eq("status", "deleted");
  if (error) return fail("Storage 文件已删除，但图片资产记录删除失败，请联系管理员检查。");

  const audited = await writeAdminAuditLog({
    actorId: context.userId,
    action: "purge_image_asset",
    entityType: "image_assets",
    entityId: id,
    beforeData: before,
    afterData: { storage_file_deleted: true, bucket: before.bucket, path: before.path },
  });
  if (!audited) return fail("图片已彻底清理，但审计日志写入失败。");

  revalidatePath("/admin/image-cleanup");
  revalidatePath("/admin/recycle-bin");
  return ok("图片 Storage 文件和资产记录已彻底清理。");
}

async function getImageCleanupActionContext(): Promise<ImageCleanupActionContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Supabase 环境变量未配置，暂时无法清理图片资产。" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "请先登录管理员账号。" };

  if (!(await hasAdminModulePermission("recycle-bin", "manage_image_assets"))) {
    return { ok: false, message: "当前账号没有图片资产管理权限。" };
  }

  return { ok: true, supabase, userId: user.id };
}

async function getImagePurgeActionContext(): Promise<ImagePurgeActionContext> {
  const server = await createSupabaseServerClient();
  if (!server) return { ok: false, message: "Supabase 环境变量未配置，暂时无法清理图片资产。" };

  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user) return { ok: false, message: "请先登录管理员账号。" };

  if (!(await hasAdminModulePermission("recycle-bin", "delete_images"))) {
    return { ok: false, message: "当前账号没有删除图片权限。" };
  }

  try {
    return { ok: true, supabase: createSupabaseAdminClient(), userId: user.id };
  } catch {
    return { ok: false, message: "Supabase service role 环境变量未配置。" };
  }
}

async function readImageAsset(supabase: SupabaseServerClient | ReturnType<typeof createSupabaseAdminClient>, id: string) {
  const { data, error } = await supabase
    .from("image_assets")
    .select("id,source_type,bucket,path,public_url,external_url,external_host,owner_id,entity_type,entity_id,status,is_public,metadata,created_at,updated_at,deleted_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as {
    id: string;
    source_type: string;
    bucket: string | null;
    path: string | null;
    public_url: string | null;
    external_url: string | null;
    external_host: string | null;
    owner_id: string | null;
    entity_type: string | null;
    entity_id: string | null;
    status: string;
    is_public: boolean;
    metadata: unknown;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
}

async function isImageAssetStillReferenced(supabase: SupabaseServerClient | ReturnType<typeof createSupabaseAdminClient>, asset: Awaited<ReturnType<typeof readImageAsset>>) {
  if (!asset) return true;
  const references = await getImageAssetBusinessReferenceMap(supabase, [asset]);
  return references.has(asset.id);
}

async function writeAuditLog(
  context: Extract<ImageCleanupActionContext, { ok: true }>,
  action: string,
  entityId: string,
  beforeData: unknown,
  afterData: unknown,
) {
  return writeAdminAuditLog({
    actorId: context.userId,
    action,
    entityType: "image_assets",
    entityId,
    beforeData,
    afterData,
  });
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
