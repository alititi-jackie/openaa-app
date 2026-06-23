"use server";

import { revalidatePath } from "next/cache";
import { ADMIN_MODULES, type AdminModuleKey } from "@/features/admin/adminModules";
import type { AdminHomeActionState } from "@/features/admin-home/types";
import { adminExemptionOptions, OWNER_SUPER_ADMIN_EMAIL, type AdminExemptionKey } from "@/features/admins/adminRoleConfig";
import { writeAdminAuditLog } from "@/lib/permissions/adminAuditLog";
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
  const status = readText(formData, "status");
  const note = readText(formData, "note") || null;
  if (!userId) return fail("请先搜索并确认真实用户。");
  if (!isAdminRole(role)) return fail("请选择角色。");
  if (!isAdminStatus(status)) return fail("请选择状态。");
  if (!isConfirmed(formData)) return fail("请先输入 CONFIRM 完成二次确认。");

  const context = await getSuperAdminActionContext();
  if (!context.ok) return fail(context.message);
  if (userId === context.userId) return fail("不能修改自己的管理员权限。");

  const profile = await readProfile(context.supabase, userId);
  if (!profile) return fail("没有找到真实用户，请先搜索并确认 user id 后再授权。");
  if (isOwnerSuperAdminProfile(profile)) return fail("内置首席超级管理员只能通过代码或 migration 修改，不能在后台授权表单中变更。");

  const authorization = await readAuthorizationData(context.supabase);
  const permissionKeys = normalizePermissionKeys(formData, role, authorization.allPermissionKeys);
  if (role !== "super_admin" && permissionKeys.length === 0) return fail("普通管理员至少需要选择一个权限。");
  const moduleKeys = role === "super_admin" ? allAdminModuleKeys() : deriveModuleKeys(permissionKeys, authorization.modulePermissionMap);
  const exemptionKeys = role === "super_admin" ? allAdminExemptionKeys() : readExemptionKeys(formData);
  const isActive = status === "active";
  const before = await readAdminRole(context.supabase, userId);
  const beforeModules = await readAdminModules(context.supabase, userId);
  const beforePermissions = await readAdminPermissions(context.supabase, userId);
  const beforeExemptions = await readAdminExemptions(context.supabase, userId);
  const payload = {
    user_id: userId,
    role,
    is_active: isActive,
    note,
    granted_by: context.userId,
    granted_at: new Date().toISOString(),
    revoked_at: isActive ? null : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await context.supabase.from("admin_roles").upsert(payload, { onConflict: "user_id" }).select("id").single();
  if (error || !data) return fail("管理员授权保存失败，请稍后再试。");
  const grantsSaved = await saveAdminGrants(context, userId, permissionKeys, moduleKeys, exemptionKeys);
  if (!grantsSaved) return fail("管理员已授权，但功能授权保存失败，请稍后再试。");
  if (
    !(await auditLog(context, before ? "update_admin_role" : "add_admin_role", "admin_roles", data.id, { role: before, modules: beforeModules, permissions: beforePermissions, exemptions: beforeExemptions }, { ...payload, profile, modules: moduleKeys, permissions: permissionKeys, exemptions: exemptionKeys }))
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
  const status = readText(formData, "status");
  const note = readText(formData, "note") || null;
  if (!roleId) return fail("管理员记录参数无效。");
  if (!isAdminRole(role)) return fail("请选择角色。");
  if (!isAdminStatus(status)) return fail("请选择状态。");
  if (!isConfirmed(formData)) return fail("请先输入 CONFIRM 完成二次确认。");

  const context = await getSuperAdminActionContext();
  if (!context.ok) return fail(context.message);

  const before = await readAdminRoleById(context.supabase, roleId);
  if (before?.user_id === context.userId) return fail("不能修改自己的管理员权限。");
  if (!before) return fail("管理员记录不存在。");
  const profile = await readProfile(context.supabase, before.user_id);
  if (profile && isOwnerSuperAdminProfile(profile)) return fail("内置首席超级管理员只能通过代码或 migration 修改，不能在后台停用、降级或减少权限。");

  const authorization = await readAuthorizationData(context.supabase);
  const permissionKeys = normalizePermissionKeys(formData, role, authorization.allPermissionKeys);
  if (role !== "super_admin" && permissionKeys.length === 0) return fail("普通管理员至少需要选择一个权限。");
  const moduleKeys = role === "super_admin" ? allAdminModuleKeys() : deriveModuleKeys(permissionKeys, authorization.modulePermissionMap);
  const exemptionKeys = role === "super_admin" ? allAdminExemptionKeys() : readExemptionKeys(formData);
  const isActive = status === "active";
  if (await wouldRemoveLastActiveSuperAdmin(context.supabase, before.user_id, role, isActive)) return fail("不能停用或降级最后一个启用的超级管理员。");

  const [beforeModules, beforePermissions, beforeExemptions] = await Promise.all([
    readAdminModules(context.supabase, before.user_id),
    readAdminPermissions(context.supabase, before.user_id),
    readAdminExemptions(context.supabase, before.user_id),
  ]);

  const payload = { role, note, is_active: isActive, revoked_at: isActive ? null : new Date().toISOString(), updated_at: new Date().toISOString() };
  const { error } = await context.supabase.from("admin_roles").update(payload).eq("id", roleId);
  if (error) return fail("管理员角色更新失败，请确认不会降级最后一个超级管理员。");
  const grantsSaved = await saveAdminGrants(context, before.user_id, permissionKeys, moduleKeys, exemptionKeys);
  if (!grantsSaved) return fail("角色已更新，但功能授权保存失败，请稍后再试。");
  if (!(await auditLog(context, "change_admin_role", "admin_roles", roleId, { role: before, modules: beforeModules, permissions: beforePermissions, exemptions: beforeExemptions }, { ...payload, modules: moduleKeys, permissions: permissionKeys, exemptions: exemptionKeys }))) {
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
  const profile = await readProfile(context.supabase, before.user_id);
  if (profile && isOwnerSuperAdminProfile(profile)) return fail("内置首席超级管理员不能在后台停用或恢复。");
  if (await wouldRemoveLastActiveSuperAdmin(context.supabase, before.user_id, before.role, active)) return fail("不能停用最后一个启用的超级管理员。");

  const payload = active
    ? { is_active: true, revoked_at: null, updated_at: new Date().toISOString() }
    : { is_active: false, revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() };

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

async function readAdminPermissions(supabase: SupabaseServerClient, userId: string) {
  const { data } = await supabase.from("admin_user_permissions").select("permission_key,effect").eq("user_id", userId);
  return ((data ?? []) as Array<{ permission_key: string; effect: string }>).filter((item) => item.effect === "allow").map((item) => item.permission_key);
}

async function readAuthorizationData(supabase: SupabaseServerClient) {
  const [permissionsResult, modulePermissionsResult] = await Promise.all([
    supabase.from("admin_permissions").select("permission_key"),
    supabase.from("admin_module_permissions").select("module_key,permission_key"),
  ]);
  const allPermissionKeys = ((permissionsResult.data ?? []) as Array<{ permission_key: string }>).map((row) => row.permission_key);
  const permissionSet = new Set(allPermissionKeys);
  const modulePermissionMap: Record<string, string[]> = {};
  for (const row of (modulePermissionsResult.data ?? []) as Array<{ module_key: string; permission_key: string }>) {
    if (!permissionSet.has(row.permission_key)) continue;
    modulePermissionMap[row.module_key] = [...(modulePermissionMap[row.module_key] ?? []), row.permission_key];
  }
  return {
    allPermissionKeys,
    modulePermissionMap,
  };
}

async function saveAdminGrants(
  context: Extract<AdminActionContext, { ok: true }>,
  userId: string,
  permissionKeys: string[],
  moduleKeys: AdminModuleKey[],
  exemptionKeys: AdminExemptionKey[],
) {
  const now = new Date().toISOString();
  const allowedPermissionKeys = Array.from(new Set(permissionKeys));
  const allowedModules = Array.from(new Set(moduleKeys.filter(isAdminModuleKey)));
  const allowedExemptions = Array.from(new Set(exemptionKeys.filter(isAdminExemptionKey)));

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

  const { error: deletePermissionError } = await context.supabase.from("admin_user_permissions").delete().eq("user_id", userId);
  if (deletePermissionError) return false;
  if (allowedPermissionKeys.length > 0) {
    const { error } = await context.supabase.from("admin_user_permissions").insert(
      allowedPermissionKeys.map((permissionKey) => ({
        user_id: userId,
        permission_key: permissionKey,
        effect: "allow",
        reason: "Synced from admin permission grant",
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
  return writeAdminAuditLog({
    actorId: context.userId,
    action,
    entityType,
    entityId,
    beforeData,
    afterData,
  });
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizePermissionKeys(formData: FormData, role: AdminRoleName, allPermissionKeys: string[]) {
  const allPermissionSet = new Set(allPermissionKeys);
  if (role === "super_admin") return Array.from(allPermissionSet).sort();
  return Array.from(
    new Set(
      formData
        .getAll("permission_keys")
        .filter((value): value is string => typeof value === "string" && allPermissionSet.has(value)),
    ),
  ).sort();
}

function deriveModuleKeys(permissionKeys: string[], modulePermissionMap: Record<string, string[]>): AdminModuleKey[] {
  const selected = new Set(permissionKeys);
  return Object.entries(modulePermissionMap)
    .filter(([moduleKey, mappedPermissions]) => isAdminModuleKey(moduleKey) && mappedPermissions.some((permissionKey) => selected.has(permissionKey)))
    .map(([moduleKey]) => moduleKey as AdminModuleKey);
}

function readExemptionKeys(formData: FormData): AdminExemptionKey[] {
  return formData.getAll("exemption_keys").filter((value): value is AdminExemptionKey => typeof value === "string" && isAdminExemptionKey(value));
}

function allAdminModuleKeys(): AdminModuleKey[] {
  return ADMIN_MODULES.map((module) => module.key);
}

function allAdminExemptionKeys(): AdminExemptionKey[] {
  return adminExemptionOptions.map((option) => option.key);
}

function isConfirmed(formData: FormData) {
  return readText(formData, "confirm") === "CONFIRM";
}

function isAdminRole(value: string): value is AdminRoleName {
  return value === "super_admin" || value === "admin" || value === "editor" || value === "moderator" || value === "support";
}

function isAdminStatus(value: string): value is "active" | "inactive" {
  return value === "active" || value === "inactive";
}

function isAdminModuleKey(value: string): value is AdminModuleKey {
  return ADMIN_MODULES.some((module) => module.key === value);
}

function isAdminExemptionKey(value: string): value is AdminExemptionKey {
  return adminExemptionOptions.some((option) => option.key === value);
}

function isOwnerSuperAdminProfile(profile: { email: string | null }) {
  return profile.email?.trim().toLowerCase() === OWNER_SUPER_ADMIN_EMAIL;
}

async function wouldRemoveLastActiveSuperAdmin(supabase: SupabaseServerClient, targetUserId: string, nextRole: AdminRoleName, nextActive: boolean) {
  if (nextRole === "super_admin" && nextActive) return false;
  const { count, error } = await supabase
    .from("admin_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "super_admin")
    .eq("is_active", true)
    .neq("user_id", targetUserId);
  if (error) return true;
  return (count ?? 0) === 0;
}
