"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileStatus } from "@/lib/supabase/types";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export type AdminUserActionState = {
  ok: boolean;
  message: string;
};

type AdminUserActionContext =
  | { ok: false; message: string }
  | {
      ok: true;
      supabase: SupabaseServerClient;
      userId: string;
    };

const statusPermissions: Record<ProfileStatus, string[]> = {
  active: ["manage_user_status", "restore_users"],
  restricted: ["manage_user_status", "restrict_users"],
  banned: ["manage_user_status", "ban_users"],
  pending: ["manage_user_status"],
};

const statusLabels: Record<ProfileStatus, string> = {
  active: "正常",
  restricted: "受限",
  banned: "禁用",
  pending: "待完善",
};

async function getAdminUserActionContext(permissionKeys: string[]): Promise<AdminUserActionContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Supabase 环境变量未配置，暂时无法管理用户。" };

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

export async function setAdminUserStatus(_state: AdminUserActionState, formData: FormData): Promise<AdminUserActionState> {
  const id = readText(formData, "id");
  const status = readText(formData, "status") as ProfileStatus;

  if (!id || !isProfileStatus(status)) {
    return { ok: false, message: "操作参数无效。" };
  }

  const context = await getAdminUserActionContext(statusPermissions[status]);
  if (!context.ok) return { ok: false, message: context.message };

  const { data: before, error: readError } = await context.supabase
    .from("profiles")
    .select("id,email,nickname,status,account_type")
    .eq("id", id)
    .maybeSingle();

  if (readError || !before) {
    return { ok: false, message: "用户不存在或无权读取。" };
  }

  if (before.status === status) {
    return { ok: true, message: "用户状态未变化。" };
  }

  const now = new Date().toISOString();
  const { error } = await context.supabase
    .from("profiles")
    .update({ status, updated_at: now })
    .eq("id", id);

  if (error) {
    return { ok: false, message: "用户状态更新失败，请稍后再试。" };
  }

  const auditPayload = {
    old_status: before.status,
    new_status: status,
    email: before.email,
    nickname: before.nickname,
    account_type: before.account_type,
    metadata: {
      source: "admin_users_management",
      status_changed_at: now,
    },
  };
  const audited = await writeAuditLog(context, auditActionForStatus(status), id, before, auditPayload);
  if (!audited) {
    return { ok: false, message: "用户状态已更新，但审计日志写入失败。" };
  }

  revalidatePath("/admin/users");
  return { ok: true, message: `已将用户状态更新为${statusLabels[status]}。` };
}

export async function updateAdminUserNote(_state: AdminUserActionState, formData: FormData): Promise<AdminUserActionState> {
  const id = readText(formData, "id");
  const adminNote = readText(formData, "admin_note");
  const bannedReason = readText(formData, "banned_reason");

  if (!id) return { ok: false, message: "操作参数无效。" };

  const context = await getAdminUserActionContext(["edit_user_notes", "manage_user_status"]);
  if (!context.ok) return { ok: false, message: context.message };

  const { data: before, error: readError } = await context.supabase
    .from("profiles")
    .select("id,email,nickname,status,account_type,private_metadata")
    .eq("id", id)
    .maybeSingle();

  if (readError || !before) return { ok: false, message: "用户不存在或无权读取。" };

  const privateMetadata = isRecord(before.private_metadata) ? before.private_metadata : {};
  const nextMetadata = {
    ...privateMetadata,
    admin_note: adminNote || null,
    banned_reason: bannedReason || null,
    admin_note_updated_at: new Date().toISOString(),
    admin_note_updated_by: context.userId,
  };

  const { error } = await context.supabase
    .from("profiles")
    .update({ private_metadata: nextMetadata, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, message: "用户备注保存失败，请稍后再试。" };

  const audited = await writeAuditLog(context, "update_user_note", id, before, {
    email: before.email,
    nickname: before.nickname,
    status: before.status,
    account_type: before.account_type,
    admin_note: adminNote || null,
    banned_reason: bannedReason || null,
    metadata: { source: "admin_users_management" },
  });
  if (!audited) return { ok: false, message: "用户备注已保存，但审计日志写入失败。" };

  revalidatePath("/admin/users");
  return { ok: true, message: "用户备注已保存。" };
}

async function writeAuditLog(
  context: Extract<AdminUserActionContext, { ok: true }>,
  action: string,
  entityId: string,
  beforeData: unknown,
  afterData: unknown,
) {
  const { error } = await context.supabase.from("admin_audit_logs").insert({
    actor_id: context.userId,
    action,
    entity_type: "profiles",
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

function isProfileStatus(value: string): value is ProfileStatus {
  return value === "active" || value === "restricted" || value === "banned" || value === "pending";
}

function auditActionForStatus(status: ProfileStatus) {
  if (status === "active") return "restore_user";
  if (status === "restricted") return "restrict_user";
  if (status === "banned") return "ban_user";
  return "set_user_pending";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
