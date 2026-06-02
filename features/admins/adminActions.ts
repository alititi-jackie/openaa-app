"use server";

import { revalidatePath } from "next/cache";
import type { AdminHomeActionState } from "@/features/admin-home/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminRoleName } from "@/lib/supabase/types";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
type AdminActionContext =
  | { ok: false; message: string }
  | { ok: true; supabase: SupabaseServerClient; userId: string; isSuperAdmin: boolean };

const ok = (message: string): AdminHomeActionState => ({ ok: true, message });
const fail = (message: string): AdminHomeActionState => ({ ok: false, message });

const rolePermissions: Record<AdminRoleName, string[]> = {
  super_admin: ["manage_admins"],
  admin: ["add_admins", "manage_admins"],
  editor: ["add_admins", "manage_admins"],
  moderator: ["add_admins", "manage_admins"],
  support: ["add_admins", "manage_admins"],
};

export async function grantAdminRole(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const userId = readText(formData, "user_id");
  const role = readText(formData, "role") as AdminRoleName;
  const note = readText(formData, "note") || null;
  if (!userId || !isAdminRole(role)) return fail("授权参数无效。");
  if (!isConfirmed(formData)) return fail("请先输入 CONFIRM 完成二次确认。");

  const context = await getAdminActionContext(rolePermissions[role]);
  if (!context.ok) return fail(context.message);
  if (role === "super_admin" && !context.isSuperAdmin) return fail("只有 super_admin 可以授权新的 super_admin。");

  const profile = await readProfile(context.supabase, userId);
  if (!profile) return fail("没有找到真实用户，请先搜索并确认 user id 后再授权。");

  const before = await readAdminRole(context.supabase, userId);
  const payload = {
    user_id: userId,
    role,
    is_active: true,
    note,
    granted_by: context.userId,
    granted_at: new Date().toISOString(),
    revoked_by: null,
    revoked_at: null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await context.supabase.from("admin_roles").upsert(payload, { onConflict: "user_id" }).select("id").single();
  if (error || !data) return fail("管理员授权保存失败，请稍后再试。");
  if (!(await auditLog(context, before ? "update_admin_role" : "add_admin_role", "admin_roles", data.id, before, { ...payload, profile }))) return fail("授权已保存，但审计日志写入失败。");

  revalidatePath("/admin/admins");
  revalidatePath("/admin/dashboard");
  return ok("管理员授权已保存。");
}

export async function updateAdminRole(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const roleId = readText(formData, "role_id");
  const role = readText(formData, "role") as AdminRoleName;
  const note = readText(formData, "note") || null;
  if (!roleId || !isAdminRole(role)) return fail("角色参数无效。");
  if (!isConfirmed(formData)) return fail("请先输入 CONFIRM 完成二次确认。");

  const context = await getAdminActionContext(["edit_admin_roles", "manage_admins"]);
  if (!context.ok) return fail(context.message);
  if (role === "super_admin" && !context.isSuperAdmin) return fail("只有 super_admin 可以改成 super_admin。");

  const before = await readAdminRoleById(context.supabase, roleId);
  if (!before) return fail("管理员记录不存在。");
  if (before.role === "super_admin" && !context.isSuperAdmin) return fail("只有 super_admin 可以修改 super_admin。");

  const payload = { role, note, updated_at: new Date().toISOString() };
  const { error } = await context.supabase.from("admin_roles").update(payload).eq("id", roleId);
  if (error) return fail("管理员角色更新失败，请确认不会降级最后一个 super_admin。");
  if (!(await auditLog(context, "change_admin_role", "admin_roles", roleId, before, payload))) return fail("角色已更新，但审计日志写入失败。");

  revalidatePath("/admin/admins");
  revalidatePath("/admin/dashboard");
  return ok("管理员角色已更新。");
}

export async function setAdminRoleActive(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const roleId = readText(formData, "role_id");
  const active = readText(formData, "active") === "true";
  if (!roleId) return fail("管理员记录参数无效。");
  if (!isConfirmed(formData)) return fail("请先输入 CONFIRM 完成二次确认。");

  const context = await getAdminActionContext(active ? ["restore_admins", "manage_admins"] : ["disable_admins", "manage_admins"]);
  if (!context.ok) return fail(context.message);

  const before = await readAdminRoleById(context.supabase, roleId);
  if (!before) return fail("管理员记录不存在。");
  if (before.role === "super_admin" && !context.isSuperAdmin) return fail("只有 super_admin 可以停用或恢复 super_admin。");

  const payload = active
    ? { is_active: true, revoked_by: null, revoked_at: null, updated_at: new Date().toISOString() }
    : { is_active: false, revoked_by: context.userId, revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() };

  const { error } = await context.supabase.from("admin_roles").update(payload).eq("id", roleId);
  if (error) return fail("管理员状态更新失败，请确认不会停用最后一个 super_admin。");
  if (!(await auditLog(context, active ? "restore_admin" : "disable_admin", "admin_roles", roleId, before, payload))) return fail("状态已更新，但审计日志写入失败。");

  revalidatePath("/admin/admins");
  revalidatePath("/admin/dashboard");
  return ok(active ? "管理员已恢复。" : "管理员已停用。");
}

async function getAdminActionContext(permissionKeys: string[]): Promise<AdminActionContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Supabase 环境变量未配置，暂时无法管理后台授权。" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "请先登录管理员账号。" };

  const { data: superAdmin } = await supabase.rpc("is_super_admin");
  for (const permissionKey of permissionKeys) {
    const { data: allowed } = await supabase.rpc("has_admin_permission", { p_permission_key: permissionKey });
    if (allowed) return { ok: true, supabase, userId: user.id, isSuperAdmin: Boolean(superAdmin) };
  }
  return { ok: false, message: "当前账号没有执行此操作的后台权限。" };
}

async function readProfile(supabase: SupabaseServerClient, userId: string) {
  const { data } = await supabase.from("profiles").select("id,email,nickname,status").eq("id", userId).maybeSingle();
  return data ?? null;
}

async function readAdminRole(supabase: SupabaseServerClient, userId: string) {
  const { data } = await supabase.from("admin_roles").select("id,user_id,role,is_active,note,granted_at,revoked_at").eq("user_id", userId).maybeSingle();
  return data ?? null;
}

async function readAdminRoleById(supabase: SupabaseServerClient, id: string) {
  const { data } = await supabase.from("admin_roles").select("id,user_id,role,is_active,note,granted_at,revoked_at").eq("id", id).maybeSingle();
  return data as ({ id: string; user_id: string; role: AdminRoleName; is_active: boolean; note: string | null; granted_at: string; revoked_at: string | null } | null);
}

async function auditLog(context: Extract<AdminActionContext, { ok: true }>, action: string, entityType: string, entityId: string, beforeData: unknown, afterData: unknown) {
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

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isConfirmed(formData: FormData) {
  return readText(formData, "confirm") === "CONFIRM";
}

function isAdminRole(value: string): value is AdminRoleName {
  return value === "super_admin" || value === "admin" || value === "editor" || value === "moderator" || value === "support";
}
