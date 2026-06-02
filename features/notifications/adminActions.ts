"use server";

import { revalidatePath } from "next/cache";
import { hasAdminPermission } from "@/lib/permissions/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export type AdminNotificationActionState = {
  ok: boolean;
  message: string;
};

type AdminNotificationActionContext =
  | { ok: false; message: string }
  | { ok: true; supabase: SupabaseServerClient; userId: string };

const ok = (message: string): AdminNotificationActionState => ({ ok: true, message });
const fail = (message: string): AdminNotificationActionState => ({ ok: false, message });

export async function deleteAdminNotification(_state: AdminNotificationActionState, formData: FormData): Promise<AdminNotificationActionState> {
  const id = readText(formData, "id");
  if (!id) return fail("操作参数无效。");

  const context = await getAdminNotificationActionContext();
  if (!context.ok) return fail(context.message);

  const before = await readNotification(context.supabase, id);
  if (!before) return fail("通知不存在或无权读取。");

  const { error } = await context.supabase.from("notifications").delete().eq("id", id);
  if (error) return fail("通知删除失败，请稍后再试。");

  const audited = await writeAuditLog(context, "delete_notification", id, before, {
    notification_id: id,
    user_id: before.user_id,
    type: before.type,
    title: before.title,
    metadata: { source: "admin_notifications_management", deleted_at: new Date().toISOString() },
  });
  if (!audited) return fail("通知已删除，但审计日志写入失败。");

  revalidatePath("/admin/notifications");
  revalidatePath("/profile/notifications");
  return ok("通知已删除。");
}

async function getAdminNotificationActionContext(): Promise<AdminNotificationActionContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Supabase 环境变量未配置，暂时无法管理通知。" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "请先登录管理员账号。" };

  if (!(await hasAdminPermission("manage_notifications"))) {
    return { ok: false, message: "当前账号没有 manage_notifications 权限。" };
  }

  return { ok: true, supabase, userId: user.id };
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
