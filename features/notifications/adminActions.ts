"use server";

import { revalidatePath } from "next/cache";
import { hasAdminModulePermission, isSuperAdmin } from "@/lib/permissions/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getNotificationRecipients,
  sendNotificationFromTemplate,
  sendNotificationToUser,
  sendNotificationToUsers,
  writeNotificationAuditLog,
} from "./service";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export type AdminNotificationActionState = {
  ok: boolean;
  message: string;
};

type AdminNotificationActionContext =
  | { ok: false; message: string }
  | { ok: true; supabase: SupabaseServerClient; adminSupabase: ReturnType<typeof createSupabaseAdminClient>; userId: string };

const ok = (message: string): AdminNotificationActionState => ({ ok: true, message });
const fail = (message: string): AdminNotificationActionState => ({ ok: false, message });

export async function deleteAdminNotification(_state: AdminNotificationActionState, formData: FormData): Promise<AdminNotificationActionState> {
  const id = readText(formData, "id");
  if (!id) return fail("操作参数无效。");

  const context = await getAdminNotificationActionContext();
  if (!context.ok) return fail(context.message);

  const before = await readNotification(context.supabase, id);
  if (!before) return fail("通知不存在或无权读取。");

  const { error } = await context.adminSupabase
    .from("notifications")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);
  if (error) return fail("通知删除失败，请稍后再试。");

  const audited = await writeAuditLog(context, "soft_delete_notification", id, before, {
    notification_id: id,
    user_id: before.user_id,
    type: before.type,
    title: before.title,
    metadata: { source: "admin_notifications_management", deleted_at: new Date().toISOString() },
  });
  if (!audited) return fail("通知已删除，但审计日志写入失败。");

  revalidatePath("/admin/messages");
  revalidatePath("/profile/notifications");
  return ok("通知已删除。");
}

export async function sendAdminNotification(_state: AdminNotificationActionState, formData: FormData): Promise<AdminNotificationActionState> {
  const context = await getAdminNotificationActionContext();
  if (!context.ok) return fail(context.message);

  const userId = readText(formData, "user_id");
  const templateKey = readText(formData, "template_key");
  const title = readText(formData, "title");
  const body = readText(formData, "body");
  const type = readText(formData, "type") || "system";
  const actionUrl = readText(formData, "action_url");
  const targetType = readText(formData, "target_type");
  const targetId = readText(formData, "target_id");

  if (!userId) return fail("请输入用户 ID。");
  if (!templateKey && (!title || !body)) return fail("请选择模板，或填写自定义标题和正文。");

  const result = templateKey
    ? await sendNotificationFromTemplate({
        templateKey,
        userId,
        title,
        body,
        targetType,
        targetId,
        actionUrl,
        createdBy: context.userId,
        metadata: { source: "admin_notifications_manual_send" },
        supabase: context.adminSupabase,
      })
    : await sendNotificationToUser(
        {
          userId,
          type,
          title,
          body,
          actionUrl,
          targetType,
          targetId,
          createdBy: context.userId,
          metadata: { source: "admin_notifications_manual_send" },
        },
        context.adminSupabase,
      );

  if (!result.ok) return fail(`通知发送失败：${result.error ?? "请稍后再试。"}`);

  revalidatePath("/admin/messages");
  revalidatePath("/profile/notifications");
  revalidatePath("/profile");
  return ok("通知已发送。");
}

export async function sendBulkAdminNotification(_state: AdminNotificationActionState, formData: FormData): Promise<AdminNotificationActionState> {
  const context = await getAdminNotificationActionContext();
  if (!context.ok) return fail(context.message);
  if (!(await isSuperAdmin())) return fail("只有超级管理员可以群发通知。");

  const scope = readText(formData, "recipient_scope") === "all" ? "all" : "active";
  const templateKey = readText(formData, "template_key");
  const title = readText(formData, "title");
  const body = readText(formData, "body");
  const type = readText(formData, "type") || "system";
  const actionUrl = readText(formData, "action_url");
  const targetType = readText(formData, "target_type");
  const targetId = readText(formData, "target_id");

  if (!templateKey && (!title || !body)) return fail("请选择模板，或填写自定义标题和正文。");

  const recipients = await getNotificationRecipients(scope, context.adminSupabase);
  if (!recipients.ok) return fail(`读取收件人失败：${recipients.error}`);
  if (recipients.userIds.length === 0) return fail("没有可发送的用户。");

  let resolvedTitle = title;
  let resolvedBody = body;
  let resolvedType = type;
  let resolvedTargetType = targetType;

  if (templateKey) {
    const { data: template } = await context.adminSupabase
      .from("notification_templates")
      .select("title,body,type,target_type")
      .eq("key", templateKey)
      .eq("is_active", true)
      .maybeSingle();
    if (!template) return fail("通知模板不存在或已停用。");
    resolvedTitle = title || String(template.title);
    resolvedBody = body || String(template.body);
    resolvedType = String(template.type);
    resolvedTargetType = targetType || (typeof template.target_type === "string" ? template.target_type : "");
  }

  const result = await sendNotificationToUsers(
    recipients.userIds.map((userId) => ({
      userId,
      type: resolvedType,
      title: resolvedTitle,
      body: resolvedBody,
      actionUrl,
      targetType: resolvedTargetType,
      targetId,
      createdBy: context.userId,
      metadata: {
        source: "admin_notifications_bulk_send",
        recipient_scope: scope,
        template_key: templateKey || null,
      },
    })),
    context.adminSupabase,
  );

  if (!result.ok) return fail(`群发通知失败：${result.error ?? "请稍后再试。"}`);

  await writeNotificationAuditLog(context.adminSupabase, {
    actorId: context.userId,
    action: "send_bulk_admin_notification",
    entityId: "bulk",
    afterData: { recipient_scope: scope, recipient_count: recipients.userIds.length, template_key: templateKey || null },
  });

  revalidatePath("/admin/messages");
  return ok(`群发完成，共发送 ${result.notificationIds.length} 条通知。`);
}

async function getAdminNotificationActionContext(): Promise<AdminNotificationActionContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Supabase 环境变量未配置，暂时无法管理通知。" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "请先登录管理员账号。" };

  if (!(await hasAdminModulePermission("messages", "manage_notifications"))) {
    return { ok: false, message: "当前账号没有站内通知管理权限。" };
  }

  try {
    return { ok: true, supabase, adminSupabase: createSupabaseAdminClient(), userId: user.id };
  } catch {
    return { ok: false, message: "Supabase service role 环境变量未配置，暂时无法写入通知。" };
  }
}

async function readNotification(supabase: SupabaseServerClient, id: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("id,user_id,type,title,body,link_url,data,read_at,created_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as {
    id: string;
    user_id: string;
    type: string;
    title: string;
    body: string | null;
    link_url: string | null;
    data: Record<string, unknown>;
    read_at: string | null;
    created_at: string;
  };
}

async function writeAuditLog(
  context: Extract<AdminNotificationActionContext, { ok: true }>,
  action: string,
  entityId: string,
  beforeData: unknown,
  afterData: unknown,
) {
  const { error } = await context.supabase.from("admin_audit_logs").insert({
    actor_id: context.userId,
    action,
    entity_type: "notifications",
    entity_id: entityId,
    before_data: beforeData ?? null,
    after_data: afterData ?? null,
  });
  return !error;
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
