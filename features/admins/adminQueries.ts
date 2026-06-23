import "server-only";

import { ADMIN_MODULES, type AdminModuleKey } from "@/features/admin/adminModules";
import { getCurrentAdminRole, hasAdminPermission, isSuperAdmin } from "@/lib/permissions/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminExemptionOptions, adminRoleDefaultModules, adminRoleLabels, OWNER_SUPER_ADMIN_EMAIL, type AdminExemptionKey } from "@/features/admins/adminRoleConfig";
import type { AdminRoleName } from "@/lib/supabase/types";

const PAGE_SIZE = 20;

export type AdminsPermissions = {
  viewAdmins: boolean;
  addAdmins: boolean;
  editAdminRoles: boolean;
  disableAdmins: boolean;
  restoreAdmins: boolean;
  manageAdmins: boolean;
  editAdminPermissions: boolean;
  superAdmin: boolean;
};

export type AdminPermissionDefinition = {
  permissionKey: string;
  name: string;
  description: string | null;
  category: string;
};

export type AdminPermissionGroup = {
  moduleKey: string;
  title: string;
  description: string;
  permissions: AdminPermissionDefinition[];
};

export type AdminAuthorizationConfig = {
  allPermissionKeys: string[];
  permissionGroups: AdminPermissionGroup[];
  rolePermissionDefaults: Record<AdminRoleName, string[]>;
  modulePermissionMap: Record<string, string[]>;
};

export type AdminRoleListItem = {
  id: string;
  userId: string;
  email: string | null;
  nickname: string | null;
  role: AdminRoleName;
  roleLabel: string;
  isActive: boolean;
  note: string | null;
  grantedAt: string;
  revokedAt: string | null;
  lastAdminLoginAt: string | null;
  isCurrentUser: boolean;
  isOwnerSuperAdmin: boolean;
  moduleKeys: AdminModuleKey[];
  permissionKeys: string[];
  exemptionKeys: AdminExemptionKey[];
};

export type AdminCandidate = {
  id: string;
  email: string | null;
  nickname: string | null;
  status: string;
  existingAdminRole: AdminRoleName | null;
  existingAdminActive: boolean | null;
};

export type AdminsData = {
  state: "ready" | "missing_config" | "error";
  error?: string;
  currentRole: AdminRoleName | null;
  currentAdmin: AdminRoleListItem | null;
  permissions: AdminsPermissions;
  admins: AdminRoleListItem[];
  candidates: AdminCandidate[];
  authorizationConfig: AdminAuthorizationConfig;
  page: number;
  pageSize: number;
  pageCount: number;
  totalCount: number;
};

type RawAdminRole = {
  id: string;
  user_id: string;
  role: AdminRoleName;
  is_active: boolean;
  note: string | null;
  granted_at: string;
  revoked_at: string | null;
  last_admin_login_at: string | null;
};

type ProfileSummary = {
  id: string;
  email: string | null;
  nickname: string | null;
  status: string;
};

export async function getAdminsData({
  q,
  role,
  status,
  page = 1,
}: {
  q?: string;
  role?: AdminRoleName | "all";
  status?: "active" | "inactive" | "all";
  page?: number;
} = {}): Promise<AdminsData> {
  const supabase = await createSupabaseServerClient();
  const permissions = await getAdminsPermissions();
  const currentRole = await getCurrentAdminRole();
  const normalizedPage = Math.max(1, page);

  if (!permissions.viewAdmins && !permissions.manageAdmins) return emptyResult("ready", permissions, currentRole?.role ?? null, normalizedPage);
  if (!permissions.superAdmin) return emptyResult("ready", permissions, currentRole?.role ?? null, normalizedPage);
  if (!supabase) return emptyResult("missing_config", permissions, currentRole?.role ?? null, normalizedPage, "Supabase 环境变量未配置，暂时无法读取管理员授权。");

  let query = supabase
    .from("admin_roles")
    .select("id,user_id,role,is_active,note,granted_at,revoked_at,last_admin_login_at", { count: "exact" })
    .order("granted_at", { ascending: false });

  if (currentRole?.user_id) query = query.neq("user_id", currentRole.user_id);
  if (role && role !== "all") query = query.eq("role", role);
  if (status === "active") query = query.eq("is_active", true);
  if (status === "inactive") query = query.eq("is_active", false);

  const from = (normalizedPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, error, count } = await query.range(from, to);
  if (error) return emptyResult("error", permissions, currentRole?.role ?? null, normalizedPage, "管理员列表读取失败，请稍后再试。");

  const rows = (data ?? []) as RawAdminRole[];
  const currentRoleRow = currentRole ? { ...currentRole, revoked_at: null } : null;
  const allRows = currentRoleRow ? [...rows, currentRoleRow] : rows;
  const profileMap = await fetchProfileMap(supabase, allRows.map((item) => item.user_id));
  const userIds = allRows.map((item) => item.user_id);
  const [authorizationConfig, moduleMap, permissionMap, exemptionMap] = await Promise.all([
    fetchAdminAuthorizationConfig(supabase),
    fetchAdminModuleMap(supabase, userIds),
    fetchAdminPermissionMap(supabase, userIds),
    fetchAdminExemptionMap(supabase, userIds),
  ]);
  const admins = rows.map((item) => mapAdminRole(item, profileMap.get(item.user_id), currentRole?.user_id ?? null, moduleMap, permissionMap, exemptionMap, authorizationConfig));
  const currentAdmin = currentRoleRow ? mapAdminRole(currentRoleRow, profileMap.get(currentRoleRow.user_id), currentRoleRow.user_id, moduleMap, permissionMap, exemptionMap, authorizationConfig) : null;
  const search = q?.trim();
  const filteredAdmins = search ? filterAdmins(admins, search) : admins;
  const candidates = search && search.length >= 2 ? await searchCandidates(supabase, search, rows) : [];
  const totalCount = count ?? 0;

  return {
    state: "ready",
    currentRole: currentRole?.role ?? null,
    currentAdmin,
    permissions,
    admins: filteredAdmins,
    candidates,
    authorizationConfig,
    page: normalizedPage,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    totalCount,
  };
}

export function normalizeAdminRole(value?: string): AdminRoleName | "all" | undefined {
  if (value === "super_admin" || value === "admin" || value === "editor" || value === "moderator" || value === "support") return value;
  if (value === "all") return "all";
  return undefined;
}

export function normalizeAdminStatus(value?: string): "active" | "inactive" | "all" | undefined {
  if (value === "active" || value === "inactive" || value === "all") return value;
  return undefined;
}

async function getAdminsPermissions(): Promise<AdminsPermissions> {
  const [viewAdmins, addAdmins, editAdminRoles, disableAdmins, restoreAdmins, manageAdmins, editAdminPermissions, superAdmin] = await Promise.all([
    hasAdminPermission("view_admins"),
    hasAdminPermission("add_admins"),
    hasAdminPermission("edit_admin_roles"),
    hasAdminPermission("disable_admins"),
    hasAdminPermission("restore_admins"),
    hasAdminPermission("manage_admins"),
    hasAdminPermission("edit_admin_permissions"),
    isSuperAdmin(),
  ]);
  return { viewAdmins, addAdmins, editAdminRoles, disableAdmins, restoreAdmins, manageAdmins, editAdminPermissions, superAdmin };
}

async function fetchProfileMap(supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>, userIds: string[]) {
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  if (ids.length === 0) return new Map<string, ProfileSummary>();
  const { data } = await supabase.from("profiles").select("id,email,nickname,status").in("id", ids);
  return new Map(((data ?? []) as ProfileSummary[]).map((profile) => [profile.id, profile]));
}

async function searchCandidates(supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>, search: string, currentPageRoles: RawAdminRole[]) {
  const keyword = search.replace(/[%_,]/g, "").slice(0, 80);
  let query = supabase.from("profiles").select("id,email,nickname,status").limit(10);
  const filters = [`email.ilike.%${keyword}%`, `nickname.ilike.%${keyword}%`];
  if (isUuid(keyword)) filters.push(`id.eq.${keyword}`);
  query = query.or(filters.join(","));

  const { data, error } = await query;
  if (error || !data) return [];
  const roles = await fetchAdminRoleMap(supabase, (data as ProfileSummary[]).map((profile) => profile.id), currentPageRoles);
  return (data as ProfileSummary[]).map((profile) => ({
    id: profile.id,
    email: profile.email,
    nickname: profile.nickname,
    status: profile.status,
    existingAdminRole: roles.get(profile.id)?.role ?? null,
    existingAdminActive: roles.get(profile.id)?.is_active ?? null,
  }));
}

async function fetchAdminRoleMap(supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>, userIds: string[], currentPageRoles: RawAdminRole[]) {
  const map = new Map<string, Pick<RawAdminRole, "role" | "is_active">>();
  for (const role of currentPageRoles) map.set(role.user_id, role);
  const missing = userIds.filter((id) => !map.has(id));
  if (missing.length === 0) return map;
  const { data } = await supabase.from("admin_roles").select("user_id,role,is_active").in("user_id", missing);
  for (const role of (data ?? []) as Array<{ user_id: string; role: AdminRoleName; is_active: boolean }>) {
    map.set(role.user_id, role);
  }
  return map;
}

async function fetchAdminModuleMap(supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>, userIds: string[]) {
  const map = new Map<string, AdminModuleKey[]>();
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  if (ids.length === 0) return map;
  const { data } = await supabase.from("admin_user_modules").select("user_id,module_key,is_allowed").in("user_id", ids);
  for (const row of (data ?? []) as Array<{ user_id: string; module_key: string; is_allowed: boolean }>) {
    if (!row.is_allowed || !isAdminModuleKey(row.module_key)) continue;
    map.set(row.user_id, [...(map.get(row.user_id) ?? []), row.module_key]);
  }
  return map;
}

async function fetchAdminPermissionMap(supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>, userIds: string[]) {
  const map = new Map<string, string[]>();
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  if (ids.length === 0) return map;
  const { data } = await supabase.from("admin_user_permissions").select("user_id,permission_key,effect").in("user_id", ids);
  for (const row of (data ?? []) as Array<{ user_id: string; permission_key: string; effect: string }>) {
    if (row.effect !== "allow") continue;
    map.set(row.user_id, [...(map.get(row.user_id) ?? []), row.permission_key]);
  }
  return map;
}

async function fetchAdminExemptionMap(supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>, userIds: string[]) {
  const map = new Map<string, AdminExemptionKey[]>();
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  if (ids.length === 0) return map;
  const { data } = await supabase.from("admin_user_exemptions").select("user_id,exemption_key,is_enabled").in("user_id", ids);
  for (const row of (data ?? []) as Array<{ user_id: string; exemption_key: string; is_enabled: boolean }>) {
    if (!row.is_enabled || !isAdminExemptionKey(row.exemption_key)) continue;
    map.set(row.user_id, [...(map.get(row.user_id) ?? []), row.exemption_key]);
  }
  return map;
}

async function fetchAdminAuthorizationConfig(supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>): Promise<AdminAuthorizationConfig> {
  const [permissionsResult, rolePermissionsResult, modulePermissionsResult] = await Promise.all([
    supabase.from("admin_permissions").select("permission_key,name,description,category").order("category", { ascending: true }).order("permission_key", { ascending: true }),
    supabase.from("admin_role_permissions").select("role,permission_key,allowed").eq("allowed", true),
    supabase.from("admin_module_permissions").select("module_key,permission_key"),
  ]);

  const permissionRows = (permissionsResult.data ?? []) as Array<{ permission_key: string; name: string; description: string | null; category: string }>;
  const roleRows = (rolePermissionsResult.data ?? []) as Array<{ role: AdminRoleName; permission_key: string; allowed: boolean }>;
  const moduleRows = (modulePermissionsResult.data ?? []) as Array<{ module_key: string; permission_key: string }>;
  const permissionMap = new Map<string, AdminPermissionDefinition>(
    permissionRows.map((permission) => [
      permission.permission_key,
      {
        permissionKey: permission.permission_key,
        name: permission.name,
        description: permission.description,
        category: permission.category,
      },
    ]),
  );
  const modulePermissionMap = buildModulePermissionMap(moduleRows, permissionMap);
  const rolePermissionDefaults = buildRolePermissionDefaults(roleRows, permissionRows.map((permission) => permission.permission_key));
  const permissionGroups = buildPermissionGroups(modulePermissionMap, permissionRows, permissionMap);

  return {
    allPermissionKeys: permissionRows.map((permission) => permission.permission_key),
    permissionGroups,
    rolePermissionDefaults,
    modulePermissionMap,
  };
}

function mapAdminRole(
  row: RawAdminRole,
  profile: ProfileSummary | undefined,
  currentUserId: string | null,
  moduleMap: Map<string, AdminModuleKey[]>,
  permissionMap: Map<string, string[]>,
  exemptionMap: Map<string, AdminExemptionKey[]>,
  authorizationConfig: AdminAuthorizationConfig,
): AdminRoleListItem {
  const moduleKeys = row.role === "super_admin" ? adminRoleDefaultModules.super_admin : (moduleMap.get(row.user_id) ?? []);
  const explicitPermissionKeys = permissionMap.get(row.user_id) ?? [];
  const modulePermissionKeys = moduleKeys.flatMap((moduleKey) => authorizationConfig.modulePermissionMap[moduleKey] ?? []);
  const permissionKeys = row.role === "super_admin"
    ? authorizationConfig.allPermissionKeys
    : explicitPermissionKeys.length > 0
      ? explicitPermissionKeys
      : modulePermissionKeys.length > 0
        ? modulePermissionKeys
        : authorizationConfig.rolePermissionDefaults[row.role];

  return {
    id: row.id,
    userId: row.user_id,
    email: profile?.email ?? null,
    nickname: profile?.nickname ?? null,
    role: row.role,
    roleLabel: adminRoleLabels[row.role],
    isActive: row.is_active,
    note: row.note,
    grantedAt: row.granted_at,
    revokedAt: row.revoked_at,
    lastAdminLoginAt: row.last_admin_login_at,
    isCurrentUser: row.user_id === currentUserId,
    isOwnerSuperAdmin: row.role === "super_admin" && profile?.email?.trim().toLowerCase() === OWNER_SUPER_ADMIN_EMAIL,
    moduleKeys,
    permissionKeys: Array.from(new Set(permissionKeys)).sort(),
    exemptionKeys: row.role === "super_admin" ? adminExemptionOptions.map((option) => option.key) : (exemptionMap.get(row.user_id) ?? []),
  };
}

function filterAdmins(admins: AdminRoleListItem[], search: string) {
  const lowered = search.toLowerCase();
  return admins.filter((admin) => admin.userId.toLowerCase().includes(lowered) || admin.email?.toLowerCase().includes(lowered) || admin.nickname?.toLowerCase().includes(lowered));
}

function emptyResult(state: AdminsData["state"], permissions: AdminsPermissions, currentRole: AdminRoleName | null, page: number, error?: string): AdminsData {
  return {
    state,
    error,
    currentRole,
    currentAdmin: null,
    permissions,
    admins: [],
    candidates: [],
    authorizationConfig: emptyAuthorizationConfig(),
    page,
    pageSize: PAGE_SIZE,
    pageCount: 1,
    totalCount: 0,
  };
}

function emptyAuthorizationConfig(): AdminAuthorizationConfig {
  return {
    allPermissionKeys: [],
    permissionGroups: [],
    rolePermissionDefaults: {
      support: [],
      moderator: [],
      editor: [],
      admin: [],
      super_admin: [],
    },
    modulePermissionMap: {},
  };
}

function buildModulePermissionMap(
  rows: Array<{ module_key: string; permission_key: string }>,
  permissionMap: Map<string, AdminPermissionDefinition>,
) {
  const map: Record<string, string[]> = {};
  for (const row of rows) {
    if (!permissionMap.has(row.permission_key)) continue;
    map[row.module_key] = [...(map[row.module_key] ?? []), row.permission_key];
  }
  return Object.fromEntries(Object.entries(map).map(([moduleKey, permissionKeys]) => [moduleKey, Array.from(new Set(permissionKeys)).sort()]));
}

function buildRolePermissionDefaults(rows: Array<{ role: AdminRoleName; permission_key: string }>, allPermissionKeys: string[]): Record<AdminRoleName, string[]> {
  const defaults: Record<AdminRoleName, string[]> = {
    support: [],
    moderator: [],
    editor: [],
    admin: [],
    super_admin: allPermissionKeys,
  };
  for (const row of rows) {
    defaults[row.role] = [...(defaults[row.role] ?? []), row.permission_key];
  }
  return {
    support: Array.from(new Set(defaults.support)).sort(),
    moderator: Array.from(new Set(defaults.moderator)).sort(),
    editor: Array.from(new Set(defaults.editor)).sort(),
    admin: Array.from(new Set(defaults.admin)).sort(),
    super_admin: Array.from(new Set(defaults.super_admin)).sort(),
  };
}

function buildPermissionGroups(
  modulePermissionMap: Record<string, string[]>,
  permissionRows: Array<{ permission_key: string; name: string; description: string | null; category: string }>,
  permissionMap: Map<string, AdminPermissionDefinition>,
): AdminPermissionGroup[] {
  const grouped = new Set<string>();
  const groups: AdminPermissionGroup[] = ADMIN_MODULES.map((module) => {
    const permissionKeys = Array.from(new Set(modulePermissionMap[module.key] ?? module.permissionKeys)).filter((key) => permissionMap.has(key));
    for (const permissionKey of permissionKeys) grouped.add(permissionKey);
    return {
      moduleKey: module.key,
      title: module.title,
      description: module.description,
      permissions: permissionKeys.map((key) => permissionMap.get(key)).filter((permission): permission is AdminPermissionDefinition => Boolean(permission)),
    };
  }).filter((group) => group.permissions.length > 0);

  const ungroupedPermissions = permissionRows
    .filter((permission) => !grouped.has(permission.permission_key))
    .map((permission) => permissionMap.get(permission.permission_key))
    .filter((permission): permission is AdminPermissionDefinition => Boolean(permission));
  if (ungroupedPermissions.length > 0) {
    groups.push({
      moduleKey: "unmapped",
      title: "未分组权限",
      description: "当前未映射到后台模块的权限。",
      permissions: ungroupedPermissions,
    });
  }
  return groups;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function isAdminModuleKey(value: string): value is AdminModuleKey {
  return ADMIN_MODULES.some((module) => module.key === value);
}

function isAdminExemptionKey(value: string): value is AdminExemptionKey {
  return adminExemptionOptions.some((option) => option.key === value);
}
