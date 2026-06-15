import "server-only";

import { ADMIN_MODULES, type AdminModuleKey } from "@/features/admin/adminModules";
import { getCurrentAdminRole, hasAdminPermission, isSuperAdmin } from "@/lib/permissions/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminExemptionOptions, adminRoleDefaultModules, adminRoleLabels, type AdminExemptionKey } from "@/features/admins/adminRoleConfig";
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
  moduleKeys: AdminModuleKey[];
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
  permissions: AdminsPermissions;
  admins: AdminRoleListItem[];
  candidates: AdminCandidate[];
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

  if (role && role !== "all") query = query.eq("role", role);
  if (status === "active") query = query.eq("is_active", true);
  if (status === "inactive") query = query.eq("is_active", false);

  const from = (normalizedPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, error, count } = await query.range(from, to);
  if (error) return emptyResult("error", permissions, currentRole?.role ?? null, normalizedPage, "管理员列表读取失败，请稍后再试。");

  const rows = (data ?? []) as RawAdminRole[];
  const profileMap = await fetchProfileMap(supabase, rows.map((item) => item.user_id));
  const userIds = rows.map((item) => item.user_id);
  const [moduleMap, exemptionMap] = await Promise.all([
    fetchAdminModuleMap(supabase, userIds),
    fetchAdminExemptionMap(supabase, userIds),
  ]);
  const admins = rows.map((item) => mapAdminRole(item, profileMap.get(item.user_id), currentRole?.user_id ?? null, moduleMap, exemptionMap));
  const search = q?.trim();
  const filteredAdmins = search ? filterAdmins(admins, search) : admins;
  const candidates = search && search.length >= 2 ? await searchCandidates(supabase, search, rows) : [];
  const totalCount = count ?? 0;

  return {
    state: "ready",
    currentRole: currentRole?.role ?? null,
    permissions,
    admins: filteredAdmins,
    candidates,
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

function mapAdminRole(
  row: RawAdminRole,
  profile: ProfileSummary | undefined,
  currentUserId: string | null,
  moduleMap: Map<string, AdminModuleKey[]>,
  exemptionMap: Map<string, AdminExemptionKey[]>,
): AdminRoleListItem {
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
    moduleKeys: row.role === "super_admin" ? adminRoleDefaultModules.super_admin : (moduleMap.get(row.user_id) ?? []),
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
    permissions,
    admins: [],
    candidates: [],
    page,
    pageSize: PAGE_SIZE,
    pageCount: 1,
    totalCount: 0,
  };
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
