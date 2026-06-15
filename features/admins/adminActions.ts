"use server";

import { revalidatePath } from "next/cache";
import { ADMIN_MODULES, type AdminModuleKey } from "@/features/admin/adminModules";
import type { AdminHomeActionState } from "@/features/admin-home/types";
import { adminExemptionOptions, adminRoleDefaultModules, type AdminExemptionKey } from "@/features/admins/adminRoleConfig";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminRoleName } from "@/lib/supabase/types";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
type AdminActionContext =
  | { ok: false; message: string }
  | { ok: true; supabase: SupabaseServerClient; userId: string; isSuperAdmin: boolean };

const ok = (message: string): AdminHomeActionState => ({ ok: true, message });
const fail = (message: string): AdminHomeActionState => ({ ok: false, message });

export async function grantAdminRole(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const userId = readText(formData, "user_id");
  const role = readText(formData, "role") as AdminRoleName;
  const note = readText(formData, "note") || null;
  if (!userId || !isAdminRole(role)) return fail("授权参数无效。");
  if (!isConfirmed(formData)) return fail("请先输入 CONFIRM 完成二次确认。");

  const context = await getSuperAdminActionContext();
  if (!context.ok) return fail(context.message);
  if (userId === context.userId) return fail("不能修改自己的管理员权限。");

  const profile = await readProfile(context.supabase, userId);
  if (!profile) return fail("没有找到真实用户，请先搜索并确认 user id 后再授权。");

  const before = await readAdminRole(context.supabase, userId);
  const beforeModules = await readAdminModules(context.supabase, userId);
  const beforeExemptions = await readAdminExemptions(context.supabase, userId);
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
  const modules = role === "super_admin" ? adminRoleDefaultModules.super_admin : adminRoleDefaultModules[role];
  const exemptions = role === "super_admin" ? adminExemptionOptions.map((option) => option.key) : [];
  const grantsSaved = await saveAdminGrants(context, userId, modules, exemptions);
  if (!grantsSaved) return fail("管理员已授权，但功能授权保存失败，请稍后再试。");
  if (
    !(await auditLog(context, before ? "update_admin_role" : "add_admin_role", "admin_roles", data.id, { role: before, modules: beforeModules, exemptions: beforeExemptions }, { ...payload, profile, modules, exemptions }))
  ) {
    return fail("授权已保存，但审计日志写入失败。");
  }

  revalidatePath("/admin/admins");
  revalidatePath("/admin/dashboard");
  return ok("管理员授权已保存。");
}

export async function updateAdminRole(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const roleId = readText(formData, "role_id");
  const role = readText(formData, "role") as AdminRoleName;
  const note = readText(formData, "note") || null;
  const modules = role === "super_admin" ? adminRoleDefaultModules.super_admin : readModuleKeys(formData);
  const exemptions = role === "super_admin" ? adminExemptionOptions.map((option) => option.key) : readExemptionKeys(formData);
  if (!roleId || !isAdminRole(role)) return fail("角色参数无效。");
  if (!isConfirmed(formData)) return fail("请先输入 CONFIRM 完成二次确认。");

  const context = await getSuperAdminActionContext();
  if (!context.ok) return fail(context.message);

  const before = await readAdminRoleById(context.supabase, roleId);
  if (before?.user_id === context.userId) return fail("不能修改自己的管理员权限。");
  if (!before) return fail("管理员记录不存在。");
  const [beforeModules, beforeExemptions] = await Promise.all([
    readAdminModules(context.supabase, before.user_id),
    readAdminExemptions(context.supabase, before.user_id),
  ]);

  const payload = { role, note, updated_at: new Date().toISOString() };
  const { error } = await context.supabase.from("admin_roles").update(payload).eq("id", roleId);
  if (error) return fail("管理员角色更新失败，请确认不会降级最后一个超级管理员。");
  const grantsSaved = await saveAdminGrants(context, before.user_id, modules, exemptions);
  if (!grantsSaved) return fail("角色已更新，但功能授权保存失败，请稍后再试。");
  if (!(await auditLog(context, "change_admin_role", "admin_roles", roleId, { role: before, modules: beforeModules, exemptions: beforeExemptions }, { ...payload, modules, exemptions }))) {
    return fail("角色已更新，但审计日志写入失败。");
  }

  revalidatePath("/admin/admins");
  revalidatePath("/admin/dashboard");
  return ok("管理员角色已更新。");
}

export async function setAdminRoleActive(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const roleId = readText(formData, "role_id");
  const active = readText(formData, "active") === "true";
  if (!roleId) return fail("管理员记录参数无效。");
  if (!isConfirmed(formData)) return fail("请先输入 CONFIRM 完成二次确认。");

  const context = await getSuperAdminActionContext();
  if (!context.ok) return fail(context.message);

  const before = await readAdminRoleById(context.supabase, roleId);
  if (before?.user_id === context.userId) return fail(active ? "不能恢复自己的管理员账号。" : "不能停用自己的管理员账号。");
  if (!before) return fail("管理员记录不存在。");

  const payload = active
    ? { is_active: true, revoked_by: null, revoked_at: null, updated_at: new Date().toISOString() }
    : { is_active: false, revoked_by: context.userId, revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() };

  const { error } = await context.supabase.from("admin_roles").update(payload).eq("id", roleId);
  if (error) return fail("管理员状态更新失败，请确认不会停用最后一个超级管理员。");
  if (!(await auditLog(context, active ? "restore_admin" : "disable_admin", "admin_roles", roleId, before, payload))) return fail("状态已更新，但审计日志写入失败。");

  revalidatePath("/admin/admins");
  revalidatePath("/admin/dashboard");
  return ok(active ? "管理员已恢复。" : "管理员已停用。");
}

async function getSuperAdminActionContext(): Promise<AdminActionContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Supabase 环境变量未配置，暂时无法管理后台授权。" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "请先登录管理员账号。" };

  const { data: superAdmin } = await supabase.rpc("is_super_admin");
  if (!superAdmin) return { ok: false, message: "只有超级管理员可以管理管理员授权。" };
  return { ok: true, supabase, userId: user.id, isSuperAdmin: true };
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

async function readAdminModules(supabase: SupabaseServerClient, userId: string) {
  const { data } = await supabase.from("admin_user_modules").select("module_key,is_allowed").eq("user_id", userId);
  return ((data ?? []) as Array<{ module_key: string; is_allowed: boolean }>).filter((item) => item.is_allowed).map((item) => item.module_key);
}

async function readAdminExemptions(supabase: SupabaseServerClient, userId: string) {
  const { data } = await supabase.from("admin_user_exemptions").select("exemption_key,is_enabled").eq("user_id", userId);
  return ((data ?? []) as Array<{ exemption_key: string; is_enabled: boolean }>).filter((item) => item.is_enabled).map((item) => item.exemption_key);
}

async function saveAdminGrants(context: Extract<AdminActionContext, { ok: true }>, userId: string, moduleKeys: AdminModuleKey[], exemptionKeys: AdminExemptionKey[]) {
  const now = new Date().toISOString();
  const allowedModules = Array.from(new Set(moduleKeys.filter(isAdminModuleKey)));
  const allowedExemptions = Array.from(new Set(exemptionKeys.filter(isAdminExemptionKey)));
  const modulePermissionKeys = Array.from(new Set(ADMIN_MODULES.flatMap((module) => module.permissionKeys).filter((key) => key !== "super_admin")));
  const allowedPermissionKeys = Array.from(
    new Set(
      ADMIN_MODULES
        .filter((module) => allowedModules.includes(module.key))
        .flatMap((module) => module.permissionKeys)
        .filter((key) => key !== "super_admin"),
    ),
  );

  const { error: deleteModuleError } = await context.supabase.from("admin_user_modules").delete().eq("user_id", userId);
  if (deleteModuleError) return false;
  if (allowedModules.length > 0) {
    const { error } = await context.supabase.from("admin_user_modules").insert(
      allowedModules.map((moduleKey) => ({
        user_id: userId,
        module_key: moduleKey,
        is_allowed: true,
        granted_by: context.userId,
        created_at: now,
        updated_at: now,
      })),
    );
    if (error) return false;
  }

  const { error: deleteExemptionError } = await context.supabase.from("admin_user_exemptions").delete().eq("user_id", userId);
  if (deleteExemptionError) return false;
  if (allowedExemptions.length > 0) {
    const { error } = await context.supabase.from("admin_user_exemptions").insert(
      allowedExemptions.map((exemptionKey) => ({
        user_id: userId,
        exemption_key: exemptionKey,
        is_enabled: true,
        granted_by: context.userId,
        created_at: now,
        updated_at: now,
      })),
    );
    if (error) return false;
  }

  if (modulePermissionKeys.length > 0) {
    const { error } = await context.supabase.from("admin_user_permissions").delete().eq("user_id", userId).in("permission_key", modulePermissionKeys);
    if (error) return false;
  }
  if (allowedPermissionKeys.length > 0) {
    const { error } = await context.supabase.from("admin_user_permissions").insert(
      allowedPermissionKeys.map((permissionKey) => ({
        user_id: userId,
        permission_key: permissionKey,
        effect: "allow",
        reason: "Synced from admin module grant",
        granted_by: context.userId,
        created_at: now,
        updated_at: now,
      })),
    );
    if (error) return false;
  }

  return true;
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

function readModuleKeys(formData: FormData): AdminModuleKey[] {
  return formData.getAll("module_keys").filter((value): value is AdminModuleKey => typeof value === "string" && isAdminModuleKey(value));
}

function readExemptionKeys(formData: FormData): AdminExemptionKey[] {
  return formData.getAll("exemption_keys").filter((value): value is AdminExemptionKey => typeof value === "string" && isAdminExemptionKey(value));
}

function isConfirmed(formData: FormData) {
  return readText(formData, "confirm") === "CONFIRM";
}

function isAdminRole(value: string): value is AdminRoleName {
  return value === "super_admin" || value === "admin" || value === "editor" || value === "moderator" || value === "support";
}

function isAdminModuleKey(value: string): value is AdminModuleKey {
  return ADMIN_MODULES.some((module) => module.key === value);
}

function isAdminExemptionKey(value: string): value is AdminExemptionKey {
  return adminExemptionOptions.some((option) => option.key === value);
}
