import "server-only";

import { hasAdminPermission } from "@/lib/permissions/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileStatus } from "@/lib/supabase/types";
import type { QueryState } from "@/features/posts/types";

export type AdminUsersPermissions = {
  viewUsers: boolean;
  manageUserStatus: boolean;
  restrictUsers: boolean;
  banUsers: boolean;
  restoreUsers: boolean;
  viewUserPosts: boolean;
};

export type AdminUserListItem = {
  id: string;
  email: string | null;
  nickname: string | null;
  accountType: string;
  status: ProfileStatus;
  locationArea: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminUsersParams = {
  status?: ProfileStatus | "all";
  q?: string;
  page?: number;
};

type AdminUsersResult = {
  state: QueryState;
  permissions: AdminUsersPermissions;
  users: AdminUserListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  pageCount: number;
  error?: string;
};

type ProfileRow = {
  id: string;
  email: string | null;
  nickname: string | null;
  account_type: string;
  status: ProfileStatus;
  location_area: string | null;
  created_at: string;
  updated_at: string;
};

const ADMIN_USERS_PAGE_SIZE = 20;

export async function getAdminUsersPermissions(): Promise<AdminUsersPermissions> {
  const [viewUsers, manageUserStatus, restrictUsers, banUsers, restoreUsers, viewUserPosts] = await Promise.all([
    hasAdminPermission("view_users"),
    hasAdminPermission("manage_user_status"),
    hasAdminPermission("restrict_users"),
    hasAdminPermission("ban_users"),
    hasAdminPermission("restore_users"),
    hasAdminPermission("view_user_posts"),
  ]);

  return { viewUsers, manageUserStatus, restrictUsers, banUsers, restoreUsers, viewUserPosts };
}

export async function getAdminUsersData(params: AdminUsersParams = {}): Promise<AdminUsersResult> {
  const supabase = await createSupabaseServerClient();
  const permissions = await getAdminUsersPermissions();
  const page = normalizePage(params.page);
  const from = (page - 1) * ADMIN_USERS_PAGE_SIZE;
  const to = from + ADMIN_USERS_PAGE_SIZE - 1;

  if (!supabase) {
    return emptyResult("missing_config", permissions, page);
  }

  if (!permissions.viewUsers) {
    return emptyResult("ready", permissions, page);
  }

  let query = supabase
    .from("profiles")
    .select("id,email,nickname,account_type,status,location_area,created_at,updated_at", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  const keyword = sanitizeSearchTerm(params.q ?? "");
  if (keyword) {
    const filters = [`email.ilike.%${keyword}%`, `nickname.ilike.%${keyword}%`];
    if (isUuid(keyword)) filters.push(`id.eq.${keyword}`);
    query = query.or(filters.join(","));
  }

  const { data, error, count } = await query;
  if (error) {
    return { ...emptyResult("error", permissions, page), error: "后台用户读取失败，请稍后再试。" };
  }

  const totalCount = count ?? 0;
  return {
    state: "ready",
    permissions,
    users: ((data ?? []) as ProfileRow[]).map(mapProfile),
    page,
    pageSize: ADMIN_USERS_PAGE_SIZE,
    totalCount,
    pageCount: Math.max(1, Math.ceil(totalCount / ADMIN_USERS_PAGE_SIZE)),
  };
}

function emptyResult(state: QueryState, permissions: AdminUsersPermissions, page: number): AdminUsersResult {
  return { state, permissions, users: [], page, pageSize: ADMIN_USERS_PAGE_SIZE, totalCount: 0, pageCount: 1 };
}

function normalizePage(value?: number) {
  if (!value || !Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

function sanitizeSearchTerm(value: string) {
  return value.trim().replace(/[%_,]/g, "").slice(0, 80);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function mapProfile(row: ProfileRow): AdminUserListItem {
  return {
    id: row.id,
    email: row.email,
    nickname: row.nickname,
    accountType: row.account_type,
    status: row.status,
    locationArea: row.location_area,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
