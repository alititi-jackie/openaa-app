"use server";

import { revalidatePath } from "next/cache";
import type { AdminHomeActionState } from "@/features/admin-home/types";
import { isSuperAdmin } from "@/lib/permissions/admin";
import { writeAdminAuditLog } from "@/lib/permissions/adminAuditLog";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ok = (message: string): AdminHomeActionState => ({ ok: true, message });
const fail = (message: string): AdminHomeActionState => ({ ok: false, message });

export async function purgeDeletedNotifications(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getNotificationRecycleContext();
  if (!context.ok) return fail(context.message);

  const days = readPositiveInteger(formData, "days");
  if (!days || days < 1 || days > 3650) return fail("请输入 1 到 3650 天之间的保留天数。");
  if (formData.get("confirm_purge_notifications") !== "on") return fail("请先确认清理已删除通知。");

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const before = await context.supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .not("deleted_at", "is", null)
    .lt("deleted_at", cutoff);

  if (before.error) return fail("已删除通知统计失败，请稍后再试。");
  const deleteCount = before.count ?? 0;
  if (deleteCount < 1) return ok("没有符合条件的已删除通知。");

  const { error } = await context.supabase.from("notifications").delete().not("deleted_at", "is", null).lt("deleted_at", cutoff);
  if (error) return fail("已删除通知清理失败，请稍后再试。");

  const audited = await writeAdminAuditLog({
    actorId: context.userId,
    action: "purge_deleted_notifications",
    entityType: "notifications",
    entityId: "deleted_notifications",
    beforeData: { days, cutoff, deleteCount },
    afterData: { deletedCount: deleteCount },
  });
  if (!audited) return fail("已删除通知已清理，但审计日志写入失败。");

  revalidatePath("/admin/recycle-bin");
  revalidatePath("/admin/messages");
  return ok(`已清理 ${deleteCount} 条已删除通知。`);
}

async function getNotificationRecycleContext() {
  const server = await createSupabaseServerClient();
  if (!server) return { ok: false as const, message: "Supabase 环境变量未配置。" };

  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user) return { ok: false as const, message: "请先登录管理员账号。" };
  if (!(await isSuperAdmin())) return { ok: false as const, message: "只有超级管理员可以清理已删除通知。" };

  try {
    return { ok: true as const, userId: user.id, supabase: createSupabaseAdminClient() };
  } catch {
    return { ok: false as const, message: "Supabase service role 环境变量未配置。" };
  }
}

function readPositiveInteger(formData: FormData, key: string) {
  const raw = formData.get(key);
  const parsed = typeof raw === "string" ? Number(raw) : Number.NaN;
  return Number.isFinite(parsed) && Number.isInteger(parsed) ? parsed : null;
}
