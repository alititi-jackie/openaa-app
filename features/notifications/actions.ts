"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type NotificationActionState = {
  ok: boolean;
  message: string;
};

const profileNotificationsPath = "/profile/notifications";

async function getNotificationActionContext() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false as const, message: "Supabase 环境变量尚未配置，暂时无法更新通知。" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, message: "请先登录后再操作通知。" };
  }

  return { ok: true as const, supabase, user };
}

export async function markNotificationRead(_state: NotificationActionState, formData: FormData): Promise<NotificationActionState> {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { ok: false, message: "通知参数无效。" };
  }

  const context = await getNotificationActionContext();
  if (!context.ok) return { ok: false, message: context.message };

  const { error } = await context.supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", context.user.id)
    .is("deleted_at", null);

  if (error) {
    return { ok: false, message: "标记已读失败，请稍后再试。" };
  }

  revalidatePath(profileNotificationsPath);
  return { ok: true, message: "已标记为已读。" };
}

export async function softDeleteNotification(_state: NotificationActionState, formData: FormData): Promise<NotificationActionState> {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { ok: false, message: "通知参数无效。" };
  }

  const context = await getNotificationActionContext();
  if (!context.ok) return { ok: false, message: context.message };

  const { error } = await context.supabase
    .from("notifications")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", context.user.id)
    .is("deleted_at", null);

  if (error) {
    return { ok: false, message: "删除通知失败，请稍后再试。" };
  }

  revalidatePath(profileNotificationsPath);
  revalidatePath("/profile");
  return { ok: true, message: "通知已删除。" };
}

export async function markAllNotificationsRead(): Promise<void> {
  const context = await getNotificationActionContext();
  if (!context.ok) return;

  await context.supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", context.user.id)
    .is("deleted_at", null)
    .is("read_at", null);

  revalidatePath(profileNotificationsPath);
}
