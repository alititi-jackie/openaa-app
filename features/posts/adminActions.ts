"use server";

import { revalidatePath } from "next/cache";
import { isSuperAdmin } from "@/lib/permissions/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { POST_TYPE_TO_ROUTE } from "./constants";
import { postHref } from "./formMappers";
import {
  MAX_RECYCLE_BIN_RETENTION_DAYS,
  MIN_RECYCLE_BIN_RETENTION_DAYS,
  RECYCLE_BIN_ADMIN_RETENTION_KEY,
  RECYCLE_BIN_USER_RETENTION_KEY,
  getRecycleBinRetentionSettings,
} from "./adminQueries";
import type { PostStatus, PostType } from "./types";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
type SupabasePostClient = SupabaseServerClient | ReturnType<typeof createSupabaseAdminClient>;

export type AdminPostActionState = {
  ok: boolean;
  message: string;
};

type AdminActionContext =
  | { ok: false; message: string }
  | {
      ok: true;
      supabase: SupabaseServerClient;
      userId: string;
    };

type SuperAdminActionContext =
  | { ok: false; message: string }
  | {
      ok: true;
      supabase: SupabaseServerClient;
      adminSupabase: ReturnType<typeof createSupabaseAdminClient>;
      userId: string;
    };

const ok = (message: string): AdminPostActionState => ({ ok: true, message });
const fail = (message: string): AdminPostActionState => ({ ok: false, message });

const statusPermissions: Record<PostStatus, string[]> = {
  draft: ["moderate_posts"],
  pending_review: ["moderate_posts"],
  published: ["moderate_posts"],
  hidden: ["moderate_posts"],
  rejected: ["moderate_posts"],
  expired: ["moderate_posts"],
  deleted: ["moderate_posts"],
};

async function getAdminActionContext(permissionKeys: string[]): Promise<AdminActionContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Supabase 环境变量未配置，暂时无法管理帖子。" };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, message: "请先登录管理员账号。" };

  for (const permissionKey of permissionKeys) {
    const { data: allowed } = await supabase.rpc("has_admin_permission", { p_permission_key: permissionKey });
    if (allowed) return { ok: true, supabase, userId: user.id };
  }

  return { ok: false, message: "当前账号没有执行此操作的后台权限。" };
}

async function readPost(supabase: SupabasePostClient, id: string) {
  const { data, error } = await supabase
    .from("posts")
    .select("id,post_type,status,title,author_id,published_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as { id: string; post_type: PostType; status: PostStatus; title: string; author_id: string | null; published_at: string | null };
}

async function writeAuditLog(
  context: Extract<AdminActionContext, { ok: true }>,
  action: string,
  entityId: string,
  beforeData: unknown,
  afterData: unknown,
) {
  const { error } = await context.supabase.from("admin_audit_logs").insert({
    actor_id: context.userId,
    action,
    entity_type: "posts",
    entity_id: entityId,
    before_data: beforeData ?? null,
    after_data: afterData ?? null,
  });

  return !error;
}

export async function setAdminPostStatus(_state: AdminPostActionState, formData: FormData): Promise<AdminPostActionState> {
  const id = readText(formData, "id");
  const status = readText(formData, "status") as PostStatus;

  if (!id || !isPostStatus(status)) {
    return fail("操作参数无效。");
  }

  const context = await getAdminActionContext(statusPermissions[status]);
  if (!context.ok) return fail(context.message);

  const before = await readPost(context.supabase, id);
  if (!before) return fail("帖子不存在或无权读取。");
  if (before.status === status) return ok("帖子状态未变化。");

  const now = new Date().toISOString();
  const payload: {
    status: PostStatus;
    published_at?: string | null;
    hidden_at?: string | null;
    deleted_at?: string | null;
    deleted_by?: string | null;
    deletion_source?: "admin" | null;
    deletion_error?: string | null;
    deletion_error_at?: string | null;
    updated_at: string;
  } = {
    status,
    updated_at: now,
  };
  if (status === "published") {
    payload.published_at = before.published_at ?? now;
    payload.hidden_at = null;
    payload.deleted_at = null;
    payload.deleted_by = null;
    payload.deletion_source = null;
    payload.deletion_error = null;
    payload.deletion_error_at = null;
  }
  if (status === "hidden") {
    payload.hidden_at = now;
    payload.deleted_at = null;
    payload.deleted_by = null;
    payload.deletion_source = null;
    payload.deletion_error = null;
    payload.deletion_error_at = null;
  }
  if (status === "deleted") {
    payload.deleted_at = now;
    payload.deleted_by = context.userId;
    payload.deletion_source = "admin";
    payload.deletion_error = null;
    payload.deletion_error_at = null;
  }

  const { error } = await context.supabase.from("posts").update(payload).eq("id", id);
  if (error) return fail("帖子状态更新失败，请稍后再试。");

  const auditPayload = {
    old_status: before.status,
    new_status: status,
    post_type: before.post_type,
    title: before.title,
    author_id: before.author_id,
    metadata: {
      source: "admin_posts_management",
      status_changed_at: now,
    },
  };
  const audited = await writeAuditLog(context, auditActionForStatus(status), id, before, auditPayload);
  if (!audited) return fail("帖子状态已更新，但审计日志写入失败。");

  revalidatePost(before.post_type, id);
  return ok("帖子状态已更新。");
}

export async function restoreDeletedPost(_state: AdminPostActionState, formData: FormData): Promise<AdminPostActionState> {
  const id = readText(formData, "id");
  if (!id) return fail("操作参数无效。");

  const context = await getSuperAdminActionContext();
  if (!context.ok) return fail(context.message);

  const before = await readPost(context.adminSupabase, id);
  if (!before) return fail("帖子不存在。");
  if (before.status !== "deleted") return fail("只有已删除内容可以恢复。");

  const now = new Date().toISOString();
  const payload = {
    status: "hidden" as PostStatus,
    hidden_at: now,
    deleted_at: null,
    deleted_by: null,
    deletion_source: null,
    deletion_error: null,
    deletion_error_at: null,
    updated_at: now,
  };

  const { error } = await context.adminSupabase.from("posts").update(payload).eq("id", id);
  if (error) return fail("恢复失败，请稍后再试。");

  await writeAuditLog(context, "restore_post_from_recycle_bin", id, before, payload);
  revalidatePost(before.post_type, id);
  return ok("已恢复");
}

export async function permanentlyDeletePost(_state: AdminPostActionState, formData: FormData): Promise<AdminPostActionState> {
  const id = readText(formData, "id");
  if (!id) return fail("操作参数无效。");
  if (formData.get("confirm_permanent_delete") !== "on") return fail("请先勾选确认永久删除。");

  const context = await getSuperAdminActionContext();
  if (!context.ok) return fail(context.message);

  const before = await readPost(context.adminSupabase, id);
  if (!before) return fail("帖子不存在。");
  if (before.status !== "deleted") return fail("只有回收站内容可以永久删除。");
  if (!isManagedPostType(before.post_type)) return fail("回收站第一版只支持招聘、房屋、二手和服务。");

  const imageRows = await readPostImagesForPermanentDelete(context.adminSupabase, id);
  if (!imageRows.ok) return fail(imageRows.message);

  const storagePaths = imageRows.assets
    .filter((asset) => asset.source_type === "storage" && asset.bucket === "post-images" && typeof asset.path === "string" && asset.path.length > 0)
    .map((asset) => asset.path as string);

  if (storagePaths.length > 0) {
    const { error: storageError } = await context.adminSupabase.storage.from("post-images").remove(storagePaths);
    if (storageError) {
      const message = storageError.message || "Storage 图片删除失败。";
      await context.adminSupabase
        .from("posts")
        .update({ deletion_error: message, deletion_error_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", id);
      revalidatePath("/admin/recycle-bin");
      return fail("Storage 图片删除失败，帖子未永久删除，已标记为异常图片。");
    }
  }

  const { error: favoriteError } = await context.adminSupabase
    .from("user_favorites")
    .delete()
    .in("target_type", ["job", "housing", "marketplace", "service", "post"])
    .eq("target_id", id);
  if (favoriteError) return fail("收藏记录清理失败，帖子未永久删除。");

  const assetIds = imageRows.assets.map((asset) => asset.id).filter((assetId): assetId is string => Boolean(assetId));
  const { error: postImagesError } = await context.adminSupabase.from("post_images").delete().eq("post_id", id);
  if (postImagesError) return fail("帖子图片关联清理失败，帖子未永久删除。");

  if (assetIds.length > 0) {
    const { error: assetError } = await context.adminSupabase.from("image_assets").delete().in("id", assetIds);
    if (assetError) return fail("图片资产记录清理失败，帖子未永久删除。");
  }

  const { error: postError } = await context.adminSupabase.from("posts").delete().eq("id", id);
  if (postError) return fail("帖子永久删除失败，请稍后再试。");

  await writeAuditLog(context, "permanently_delete_post", id, before, {
    deleted_post_id: id,
    deleted_image_count: assetIds.length,
    deleted_storage_file_count: storagePaths.length,
  });
  revalidatePost(before.post_type, id);
  revalidatePath("/admin/recycle-bin");
  return ok("已永久删除。");
}

export async function updateRecycleBinRetentionSettings(_state: AdminPostActionState, formData: FormData): Promise<AdminPostActionState> {
  const userRetentionDays = readPositiveInteger(formData, "user_retention_days");
  const adminRetentionDays = readPositiveInteger(formData, "admin_retention_days");

  if (!isValidRetentionDays(userRetentionDays) || !isValidRetentionDays(adminRetentionDays)) {
    return fail("保存失败，请稍后再试");
  }

  const context = await getSuperAdminActionContext();
  if (!context.ok) return fail("保存失败，请稍后再试");

  const before = await getRecycleBinRetentionSettings(context.adminSupabase);
  const now = new Date().toISOString();
  const payload = [
    {
      key: RECYCLE_BIN_USER_RETENTION_KEY,
      value: { days: userRetentionDays },
      description: "回收站中用户删除内容的保留天数。",
      is_public: false,
      updated_by: context.userId,
      updated_at: now,
    },
    {
      key: RECYCLE_BIN_ADMIN_RETENTION_KEY,
      value: { days: adminRetentionDays },
      description: "回收站中管理员删除内容的保留天数。",
      is_public: false,
      updated_by: context.userId,
      updated_at: now,
    },
  ];

  const { error } = await context.adminSupabase.from("site_settings").upsert(payload, { onConflict: "key" });
  if (error) return fail("保存失败，请稍后再试");

  await writeAuditLog(context, "update_recycle_bin_retention_settings", "recycle_bin_retention", before, {
    userRetentionDays,
    adminRetentionDays,
  });
  revalidatePath("/admin/recycle-bin");
  return ok("删除设置已保存");
}

async function getSuperAdminActionContext(): Promise<SuperAdminActionContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Supabase 环境变量未配置。" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "请先登录管理员账号。" };
  if (!(await isSuperAdmin())) return { ok: false, message: "只有 super_admin 可以执行此操作。" };

  try {
    return { ok: true, supabase, adminSupabase: createSupabaseAdminClient(), userId: user.id };
  } catch {
    return { ok: false, message: "Supabase service role 环境变量未配置，无法执行永久删除。" };
  }
}

async function readPostImagesForPermanentDelete(adminSupabase: ReturnType<typeof createSupabaseAdminClient>, postId: string) {
  const { data, error } = await adminSupabase
    .from("post_images")
    .select("image_asset_id,image_assets(id,source_type,bucket,path)")
    .eq("post_id", postId);

  if (error) return { ok: false as const, message: "读取帖子图片失败，帖子未永久删除。" };

  const rows = (data ?? []) as Array<{ image_asset_id: string | null; image_assets?: unknown }>;
  const assets = rows
    .map((row) => imageAssetFromRelation(row.image_assets))
    .filter((asset): asset is Record<string, unknown> => Boolean(asset));

  return { ok: true as const, assets };
}

function imageAssetFromRelation(value: unknown) {
  if (!value) return null;
  if (Array.isArray(value)) return (value[0] as Record<string, unknown> | undefined) ?? null;
  return value as Record<string, unknown>;
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readPositiveInteger(formData: FormData, key: string) {
  const value = readText(formData, key);
  if (!/^\d+$/.test(value)) return Number.NaN;
  return Number(value);
}

function isValidRetentionDays(value: number) {
  return Number.isInteger(value) && value >= MIN_RECYCLE_BIN_RETENTION_DAYS && value <= MAX_RECYCLE_BIN_RETENTION_DAYS;
}

function isPostStatus(value: string): value is PostStatus {
  return value === "draft" || value === "pending_review" || value === "published" || value === "hidden" || value === "rejected" || value === "expired" || value === "deleted";
}

function isManagedPostType(value: PostType) {
  return value === "job" || value === "housing" || value === "marketplace" || value === "service";
}

function auditActionForStatus(status: PostStatus) {
  if (status === "hidden") return "hide_post";
  if (status === "published") return "publish_post";
  if (status === "deleted") return "delete_post";
  if (status === "rejected") return "reject_post";
  if (status === "pending_review") return "mark_post_pending_review";
  return `set_post_${status}`;
}

function revalidatePost(type: PostType, id: string) {
  revalidatePath("/");
  revalidatePath(POST_TYPE_TO_ROUTE[type]);
  revalidatePath(postHref(type, id));
  revalidatePath("/admin/posts");
}
