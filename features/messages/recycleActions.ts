"use server";

import { revalidatePath } from "next/cache";
import type { AdminHomeActionState } from "@/features/admin-home/types";
import { writeAdminAuditLog } from "@/lib/permissions/adminAuditLog";
import { hasAdminModule } from "@/lib/permissions/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ok = (message: string): AdminHomeActionState => ({ ok: true, message });
const fail = (message: string): AdminHomeActionState => ({ ok: false, message });

type Context =
  | { ok: false; message: string }
  | { ok: true; userId: string; supabase: ReturnType<typeof createSupabaseAdminClient> };

export async function restoreMessageRecycleItem(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getRecycleContext();
  if (!context.ok) return fail(context.message);
  const id = readText(formData, "id");
  const type = readText(formData, "type");
  if (!id) return fail("缺少记录。");

  if (type === "reports") {
    const before = await context.supabase.from("post_reports").select("*").eq("id", id).not("deleted_at", "is", null).maybeSingle();
    if (!before.data) return fail("只能恢复回收站内的举报。");
    const { error } = await context.supabase.from("post_reports").update({ deleted_at: null, deleted_by: null, updated_at: new Date().toISOString() }).eq("id", id).not("deleted_at", "is", null);
    if (error) return fail("恢复举报失败。");
    await writeAdminAuditLog({ actorId: context.userId, action: "restore_report", entityType: "post_reports", entityId: id, beforeData: before.data, afterData: { deleted_at: null } });
  } else if (type === "feedback") {
    const before = await context.supabase.from("support_tickets").select("*").eq("id", id).not("deleted_at", "is", null).maybeSingle();
    if (!before.data) return fail("只能恢复回收站内的线索与建议。");
    const { error } = await context.supabase.from("support_tickets").update({ deleted_at: null, status: "viewed", updated_at: new Date().toISOString() }).eq("id", id).not("deleted_at", "is", null);
    if (error) return fail("恢复线索与建议失败。");
    await writeAdminAuditLog({ actorId: context.userId, action: "restore_feedback", entityType: "support_tickets", entityId: id, beforeData: before.data, afterData: { deleted_at: null, status: "viewed" } });
  } else {
    return fail("不支持的记录类型。");
  }

  revalidateRecycle();
  return ok("已恢复。");
}

export async function permanentlyDeleteMessageRecycleItem(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getRecycleContext();
  if (!context.ok) return fail(context.message);
  const id = readText(formData, "id");
  const type = readText(formData, "type");
  const confirmed = formData.get("confirm_permanent_delete") === "on";
  if (!id) return fail("缺少记录。");
  if (!confirmed) return fail("请先确认永久删除。");

  if (type === "reports") {
    const before = await context.supabase.from("post_reports").select("*").eq("id", id).not("deleted_at", "is", null).maybeSingle();
    if (!before.data) return fail("只能永久删除回收站内的举报。");
    const { error } = await context.supabase.from("post_reports").delete().eq("id", id).not("deleted_at", "is", null);
    if (error) return fail("永久删除举报失败。");
    await writeAdminAuditLog({ actorId: context.userId, action: "purge_report", entityType: "post_reports", entityId: id, beforeData: before.data });
  } else if (type === "feedback") {
    const before = await context.supabase.from("support_tickets").select("*").eq("id", id).not("deleted_at", "is", null).maybeSingle();
    if (!before.data) return fail("只能永久删除回收站内的线索与建议。");
    await context.supabase.from("support_ticket_events").delete().eq("ticket_id", id);
    const { error } = await context.supabase.from("support_tickets").delete().eq("id", id).not("deleted_at", "is", null);
    if (error) return fail("永久删除线索与建议失败。");
    await writeAdminAuditLog({ actorId: context.userId, action: "purge_feedback", entityType: "support_tickets", entityId: id, beforeData: before.data });
  } else {
    return fail("不支持的记录类型。");
  }

  revalidateRecycle();
  return ok("已永久删除。");
}

async function getRecycleContext(): Promise<Context> {
  const server = await createSupabaseServerClient();
  if (!server) return { ok: false, message: "Supabase 环境变量未配置。" };
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user) return { ok: false, message: "请先登录管理员账号。" };
  if (!(await hasAdminModule("recycle-bin"))) return { ok: false, message: "当前账号没有回收站模块权限。" };
  try {
    return { ok: true, userId: user.id, supabase: createSupabaseAdminClient() };
  } catch {
    return { ok: false, message: "Supabase service role 环境变量未配置。" };
  }
}

function revalidateRecycle() {
  revalidatePath("/admin/recycle-bin");
  revalidatePath("/admin/messages");
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
