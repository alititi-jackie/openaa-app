"use server";

import { revalidatePath } from "next/cache";
import { isSuperAdmin } from "@/lib/permissions/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminPostOperationConfig } from "./adminOperations";
import { POST_TYPE_TO_ROUTE } from "./constants";
import { postHref } from "./formMappers";
import { sendNotificationFromTemplate, sendNotificationToUser, writeNotificationAuditLog } from "@/features/notifications/service";
import {
  MAX_RECYCLE_BIN_RETENTION_DAYS,
  MIN_RECYCLE_BIN_RETENTION_DAYS,
  RECYCLE_BIN_ADMIN_RETENTION_KEY,
  RECYCLE_BIN_NEWS_RETENTION_KEY,
  RECYCLE_BIN_USER_RETENTION_KEY,
  getRecycleBinNewsRetentionSettings,
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

async function writePostAdminEvent(
  supabase: SupabasePostClient,
  {
    postId,
    actorId,
    eventType,
    templateKey,
    statusBefore,
    statusAfter,
    title,
    body,
    notificationId,
    metadata,
  }: {
    postId: string;
    actorId: string;
    eventType: string;
    templateKey?: string | null;
    statusBefore?: string | null;
    statusAfter?: string | null;
    title?: string | null;
    body?: string | null;
    notificationId?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  const { error } = await supabase.from("post_admin_events").insert({
    post_id: postId,
    actor_id: actorId,
    event_type: eventType,
    template_key: templateKey || null,
    status_before: statusBefore || null,
    status_after: statusAfter || null,
    title: title || null,
    body: body || null,
    notification_id: notificationId || null,
    metadata: metadata ?? {},
  });

  if (error) {
    console.error("[admin/user-posts] Failed to write post admin event", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      postId,
      eventType,
    });
    return false;
  }

  return true;
}

export async function handleAdminPostOperation(_state: AdminPostActionState, formData: FormData): Promise<AdminPostActionState> {
  const id = readText(formData, "id");
  const operation = readText(formData, "operation");
  const config = getAdminPostOperationConfig(operation);

  if (!id || !config) {
    return fail("操作参数无效。");
  }

  const context = await getAdminActionContext(["moderate_posts"]);
  if (!context.ok) return fail(context.message);

  const before = await readPost(context.supabase, id);
  if (!before) return fail("用户发布信息不存在或无权读取。");
  if (before.status === "deleted") return fail("回收站内容请在回收站中处理。");
  if (!config.allowedStatuses.includes(before.status)) return fail("当前状态不适合执行该处理。");

  const now = new Date().toISOString();
  const notifyUser = formData.get("notify_user") === "on";
  const statusAfter = config.statusAfter ?? before.status;
  const templateKey = readText(formData, "notification_template_key") || config.defaultTemplateKey;
  const title = readText(formData, "notification_title");
  const body = readText(formData, "notification_body");
  const lastAdminReason = title || config.label;
  const payload: {
    status?: PostStatus;
    published_at?: string | null;
    hidden_at?: string | null;
    deleted_at?: string | null;
    deleted_by?: string | null;
    deletion_source?: "admin" | null;
    deletion_error?: string | null;
    deletion_error_at?: string | null;
    last_admin_action: string;
    last_admin_action_at: string;
    last_admin_action_by: string;
    last_admin_action_template_key: string | null;
    last_admin_action_reason: string | null;
    updated_at: string;
  } = {
    last_admin_action: config.eventType,
    last_admin_action_at: now,
    last_admin_action_by: context.userId,
    last_admin_action_template_key: templateKey || null,
    last_admin_action_reason: lastAdminReason,
    updated_at: now,
  };

  if (statusAfter !== before.status) {
    payload.status = statusAfter;
  }
  if (statusAfter === "published" && statusAfter !== before.status) {
    payload.published_at = before.published_at ?? now;
    payload.hidden_at = null;
    payload.deleted_at = null;
    payload.deleted_by = null;
    payload.deletion_source = null;
    payload.deletion_error = null;
    payload.deletion_error_at = null;
  }
  if (statusAfter === "hidden" && statusAfter !== before.status) {
    payload.hidden_at = now;
    payload.deleted_at = null;
    payload.deleted_by = null;
    payload.deletion_source = null;
    payload.deletion_error = null;
    payload.deletion_error_at = null;
  }
  if (statusAfter === "deleted") {
    payload.deleted_at = now;
    payload.deleted_by = context.userId;
    payload.deletion_source = "admin";
    payload.deletion_error = null;
    payload.deletion_error_at = null;
  }

  const { error } = await context.supabase.from("posts").update(payload).eq("id", id);
  if (error) {
    console.error("[admin/user-posts] Failed to handle post operation", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      postId: id,
      operation,
    });
    return fail("处理失败，请稍后再试。");
  }

  const notificationResult = notifyUser
    ? await maybeSendPostActionNotification({
        actorId: context.userId,
        authorId: before.author_id,
        postId: id,
        postType: before.post_type,
        status: statusAfter,
        templateFallback: templateKey,
        formData,
      })
    : { ok: true as const, notificationId: null };

  const metadata = {
    notify_user: notifyUser,
    notification_failed: !notificationResult.ok,
    error_message: notificationResult.ok ? null : notificationResult.message,
    operation,
    operation_label: config.label,
  };

  const audited = await writeAuditLog(context, config.auditAction, id, before, {
    old_status: before.status,
    new_status: statusAfter,
    post_type: before.post_type,
    title: before.title,
    author_id: before.author_id,
    operation,
    template_key: templateKey,
    notification_id: notificationResult.ok ? notificationResult.notificationId ?? null : null,
    metadata,
  });

  await writePostAdminEvent(context.supabase, {
    postId: id,
    actorId: context.userId,
    eventType: config.eventType,
    templateKey,
    statusBefore: before.status,
    statusAfter,
    title: title || config.label,
    body,
    notificationId: notificationResult.ok ? notificationResult.notificationId ?? null : null,
    metadata,
  });

  revalidatePost(before.post_type, id);

  if (!notificationResult.ok) return ok(`处理已完成，但通知发送失败：${notificationResult.message}`);
  if (!audited) return ok("处理已完成，但审计日志写入失败。");
  return ok(notifyUser ? "处理已完成，通知已发送。" : "处理已完成。");
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
  const shouldNotify = formData.get("notify_user") === "on";
  const eventType = eventActionForStatus(status, before.status);
  const eventTemplateKey = shouldNotify ? readText(formData, "notification_template_key") || notificationTemplateForStatus(status) : null;
  const eventTitle = shouldNotify ? readText(formData, "notification_title") : "";
  const eventBody = shouldNotify ? readText(formData, "notification_body") : "";
  const payload: {
    status: PostStatus;
    published_at?: string | null;
    hidden_at?: string | null;
    deleted_at?: string | null;
    deleted_by?: string | null;
    deletion_source?: "admin" | null;
    deletion_error?: string | null;
    deletion_error_at?: string | null;
    last_admin_action?: string | null;
    last_admin_action_at?: string | null;
    last_admin_action_by?: string | null;
    last_admin_action_template_key?: string | null;
    last_admin_action_reason?: string | null;
    updated_at: string;
  } = {
    status,
    last_admin_action: eventType,
    last_admin_action_at: now,
    last_admin_action_by: context.userId,
    last_admin_action_template_key: eventTemplateKey,
    last_admin_action_reason: eventTitle || null,
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

  const notificationResult = await maybeSendPostActionNotification({
    actorId: context.userId,
    authorId: before.author_id,
    postId: id,
    postType: before.post_type,
    status,
    formData,
  });

  await writePostAdminEvent(context.supabase, {
    postId: id,
    actorId: context.userId,
    eventType,
    templateKey: eventTemplateKey,
    statusBefore: before.status,
    statusAfter: status,
    title: eventTitle,
    body: eventBody,
  });

  revalidatePost(before.post_type, id);
  if (!notificationResult.ok) return ok(`帖子状态已更新，但通知发送失败：${notificationResult.message}`);
  return ok("帖子状态已更新。");
}

export async function sendAdminPostAuthorNotification(_state: AdminPostActionState, formData: FormData): Promise<AdminPostActionState> {
  const id = readText(formData, "id");
  if (!id) return fail("操作参数无效。");

  const context = await getAdminActionContext(["moderate_posts"]);
  if (!context.ok) return fail(context.message);

  const post = await readPost(context.supabase, id);
  if (!post) return fail("用户发布信息不存在或无权读取。");
  const templateKey = readText(formData, "notification_template_key") || notificationTemplateForStatus(post.status) || "content_issue";
  const title = readText(formData, "notification_title");
  const body = readText(formData, "notification_body");

  const notificationResult = await maybeSendPostActionNotification({
    actorId: context.userId,
    authorId: post.author_id,
    postId: id,
    postType: post.post_type,
    status: post.status,
    formData,
  });

  if (!notificationResult.ok) return fail(`通知发送失败：${notificationResult.message}`);
  const now = new Date().toISOString();
  await context.supabase
    .from("posts")
    .update({
      last_admin_action: "notify_author",
      last_admin_action_at: now,
      last_admin_action_by: context.userId,
      last_admin_action_template_key: templateKey,
      last_admin_action_reason: title || null,
      updated_at: now,
    })
    .eq("id", id);
  await writePostAdminEvent(context.supabase, {
    postId: id,
    actorId: context.userId,
    eventType: "notify_author",
    templateKey,
    statusBefore: post.status,
    statusAfter: post.status,
    title,
    body,
  });
  revalidatePath("/admin/user-posts");
  return ok("通知已发送。");
}

export async function restoreDeletedPost(_state: AdminPostActionState, formData: FormData): Promise<AdminPostActionState> {
  const id = readText(formData, "id");
  const resourceType = readText(formData, "resource_type") || readText(formData, "content_type");
  if (!id) return fail("操作参数无效。");

  const context = await getSuperAdminActionContext();
  if (!context.ok) return fail(context.message);

  if (resourceType === "news") return restoreDeletedNews(context, id);

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
    last_admin_action: "restore_post_from_recycle_bin",
    last_admin_action_at: now,
    last_admin_action_by: context.userId,
    last_admin_action_template_key: formData.get("notify_user") === "on" ? readText(formData, "notification_template_key") || "admin_post_restored" : null,
    last_admin_action_reason: formData.get("notify_user") === "on" ? readText(formData, "notification_title") || null : null,
    updated_at: now,
  };

  const { error } = await context.adminSupabase.from("posts").update(payload).eq("id", id);
  if (error) return fail("恢复失败，请稍后再试。");

  await writeAuditLog(context, "restore_post_from_recycle_bin", id, before, payload);
  const notificationResult = await maybeSendPostActionNotification({
    actorId: context.userId,
    authorId: before.author_id,
    postId: id,
    postType: before.post_type,
    status: "hidden",
    templateFallback: "admin_post_restored",
    formData,
    adminSupabase: context.adminSupabase,
  });
  await writePostAdminEvent(context.adminSupabase, {
    postId: id,
    actorId: context.userId,
    eventType: "restore_post_from_recycle_bin",
    templateKey: payload.last_admin_action_template_key,
    statusBefore: before.status,
    statusAfter: "hidden",
    title: readText(formData, "notification_title"),
    body: readText(formData, "notification_body"),
  });
  revalidatePost(before.post_type, id);
  if (!notificationResult.ok) return ok(`已恢复；通知发送失败：${notificationResult.message}`);
  return ok("已恢复");
}

export async function permanentlyDeletePost(_state: AdminPostActionState, formData: FormData): Promise<AdminPostActionState> {
  const id = readText(formData, "id");
  const resourceType = readText(formData, "resource_type") || readText(formData, "content_type");
  if (!id) return fail("操作参数无效。");
  if (formData.get("confirm_permanent_delete") !== "on") return fail("请先勾选确认永久删除。");

  const context = await getSuperAdminActionContext();
  if (!context.ok) return fail(context.message);

  if (resourceType === "news") return permanentlyDeleteNews(context, id);

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

async function restoreDeletedNews(context: Extract<SuperAdminActionContext, { ok: true }>, id: string): Promise<AdminPostActionState> {
  const before = await readNewsPostForRecycleBin(context.adminSupabase, id);
  if (!before) return fail("新闻不存在。");
  if (before.status !== "deleted") return fail("只有已删除新闻可以恢复。");

  const now = new Date().toISOString();
  const payload = {
    status: "hidden",
    deleted_at: null,
    deleted_by: null,
    updated_at: now,
  };

  const { error } = await context.adminSupabase.from("news_posts").update(payload).eq("id", id);
  if (error) return fail("恢复失败，请稍后再试。");

  await writeAuditLog(context, "restore_news_from_recycle_bin", id, before, payload);
  revalidateNews(before.slug);
  return ok("已恢复");
}

async function permanentlyDeleteNews(context: Extract<SuperAdminActionContext, { ok: true }>, id: string): Promise<AdminPostActionState> {
  const before = await readNewsPostForRecycleBin(context.adminSupabase, id);
  if (!before) return fail("新闻不存在。");
  if (before.status !== "deleted") return fail("只有回收站新闻可以永久删除。");

  const asset = before.image_assets ? imageAssetFromRelation(before.image_assets) : null;
  const storagePath = asset?.source_type === "storage" && asset.bucket === "news-cover-images" && typeof asset.path === "string" && asset.path.length > 0 ? asset.path : "";

  if (storagePath) {
    const { error: storageError } = await context.adminSupabase.storage.from("news-cover-images").remove([storagePath]);
    if (storageError) {
      const message = storageError.message || "新闻封面图片删除失败。";
      await context.adminSupabase
        .from("news_posts")
        .update({ deletion_error: message, deletion_error_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", id);
      revalidatePath("/admin/recycle-bin");
      return fail("新闻封面图片删除失败，新闻未永久删除，已标记为图片异常。");
    }
  }

  const { error: favoriteError } = await context.adminSupabase.from("user_favorites").delete().eq("target_type", "news").eq("target_id", id);
  if (favoriteError) return fail("新闻收藏记录清理失败，新闻未永久删除。");

  const { error: newsError } = await context.adminSupabase.from("news_posts").delete().eq("id", id);
  if (newsError) return fail("新闻永久删除失败，请稍后再试。");

  if (before.cover_image_asset_id) {
    const { error: assetError } = await context.adminSupabase.from("image_assets").delete().eq("id", before.cover_image_asset_id);
    if (assetError) return fail("新闻已删除，但封面资产记录清理失败。");
  }

  await writeAuditLog(context, "permanently_delete_news", id, before, {
    deleted_news_id: id,
    deleted_cover_image_asset_id: before.cover_image_asset_id,
    deleted_storage_file_count: storagePath ? 1 : 0,
  });
  revalidateNews(before.slug);
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

export async function updateRecycleBinNewsRetentionSettings(_state: AdminPostActionState, formData: FormData): Promise<AdminPostActionState> {
  const newsRetentionDays = readPositiveInteger(formData, "news_retention_days");

  if (!isValidRetentionDays(newsRetentionDays)) {
    return fail("保存失败，请稍后再试");
  }

  const context = await getSuperAdminActionContext();
  if (!context.ok) return fail("保存失败，请稍后再试");

  const before = await getRecycleBinNewsRetentionSettings(context.adminSupabase);
  const now = new Date().toISOString();
  const payload = {
    key: RECYCLE_BIN_NEWS_RETENTION_KEY,
    value: { days: newsRetentionDays },
    description: "回收站中新闻内容的保留天数。",
    is_public: false,
    updated_by: context.userId,
    updated_at: now,
  };

  const { error } = await context.adminSupabase.from("site_settings").upsert(payload, { onConflict: "key" });
  if (error) return fail("保存失败，请稍后再试");

  await writeAuditLog(context, "update_recycle_bin_news_retention_settings", "recycle_bin_news_retention", before, {
    newsRetentionDays,
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
  if (!(await isSuperAdmin())) return { ok: false, message: "只有超级管理员可以执行此操作。" };

  try {
    return { ok: true, supabase, adminSupabase: createSupabaseAdminClient(), userId: user.id };
  } catch {
    return { ok: false, message: "Supabase service role 环境变量未配置，无法执行永久删除。" };
  }
}

async function maybeSendPostActionNotification({
  actorId,
  authorId,
  postId,
  postType,
  status,
  formData,
  templateFallback,
  adminSupabase,
}: {
  actorId: string;
  authorId: string | null;
  postId: string;
  postType: PostType;
  status: PostStatus;
  formData: FormData;
  templateFallback?: string;
  adminSupabase?: ReturnType<typeof createSupabaseAdminClient>;
}): Promise<{ ok: true; notificationId?: string | null } | { ok: false; message: string }> {
  if (readText(formData, "notify_user") !== "on") return { ok: true };
  if (!authorId) return { ok: false, message: "该内容没有作者 ID。" };

  const templateKey = readText(formData, "notification_template_key") || templateFallback || notificationTemplateForStatus(status);
  if (!templateKey) return { ok: true };

  let supabase = adminSupabase;
  if (!supabase) {
    try {
      supabase = createSupabaseAdminClient();
    } catch {
      return { ok: false, message: "Supabase service role 环境变量未配置。" };
    }
  }

  const title = readText(formData, "notification_title");
  const body = readText(formData, "notification_body");
  const actionUrl = readText(formData, "notification_action_url") || "/profile/posts";

  const result = title || body
    ? await sendNotificationToUser(
        {
          userId: authorId,
          title,
          body,
          type: "content",
          targetType: "post",
          targetId: postId,
          actionUrl,
          createdBy: actorId,
          metadata: {
            source: "admin_post_action",
            status,
            template_key: templateKey,
            post_type: postType,
          },
        },
        supabase,
      )
    : await sendNotificationFromTemplate({
        templateKey,
        userId: authorId,
        targetType: "post",
        targetId: postId,
        actionUrl,
        createdBy: actorId,
        metadata: {
          source: "admin_post_action",
          status,
          post_type: postType,
        },
        supabase,
      });

  if (!result.ok) {
    await writeNotificationAuditLog(supabase, {
      actorId,
      action: "post_action_notification_failed",
      entityId: postId,
      afterData: {
        author_id: authorId,
        post_type: postType,
        status,
        template_key: templateKey,
        error: result.error ?? "Unknown notification failure.",
      },
    });
    return { ok: false, message: result.error ?? "通知发送失败。" };
  }

  return { ok: true, notificationId: result.notificationIds[0] ?? null };
}

function notificationTemplateForStatus(status: PostStatus) {
  if (status === "published") return "admin_post_published";
  if (status === "hidden") return "admin_post_hidden";
  if (status === "deleted") return "admin_post_deleted";
  if (status === "rejected") return "admin_post_rejected";
  return "";
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

function eventActionForStatus(status: PostStatus, beforeStatus: PostStatus) {
  if (status === "published" && beforeStatus === "pending_review") return "approve_post";
  return auditActionForStatus(status);
}

function revalidatePost(type: PostType, id: string) {
  revalidatePath("/");
  revalidatePath(POST_TYPE_TO_ROUTE[type]);
  revalidatePath(postHref(type, id));
  revalidatePath("/admin/user-posts");
  revalidatePath(`/admin/user-posts/${id}`);
}

function revalidateNews(slug?: string | null) {
  revalidatePath("/");
  revalidatePath("/news");
  revalidatePath("/admin/news");
  revalidatePath("/admin/recycle-bin");
  if (slug) revalidatePath(`/news/${slug}`);
}

async function readNewsPostForRecycleBin(adminSupabase: ReturnType<typeof createSupabaseAdminClient>, id: string) {
  const { data, error } = await adminSupabase
    .from("news_posts")
    .select("id,slug,title,status,cover_image_asset_id,deleted_at,deleted_by,deletion_error,deletion_error_at,image_assets(id,source_type,bucket,path)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as {
    id: string;
    slug: string;
    title: string;
    status: PostStatus | "deleted";
    cover_image_asset_id: string | null;
    deleted_at: string | null;
    deleted_by: string | null;
    image_assets?: unknown;
  };
}
