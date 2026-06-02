import "server-only";

import { hasAdminPermission } from "@/lib/permissions/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileStatus } from "@/lib/supabase/types";
import type { QueryState } from "@/features/posts/types";

export type AdminUsersPermissions = {
  viewUsers: boolean;
  viewPosts: boolean;
  moderatePosts: boolean;
  manageUserStatus: boolean;
  restrictUsers: boolean;
  banUsers: boolean;
  restoreUsers: boolean;
  viewUserPosts: boolean;
  editUserNotes: boolean;
};

export type AdminUserListItem = {
  id: string;
  email: string | null;
  nickname: string | null;
  accountType: string;
  status: ProfileStatus;
  locationArea: string | null;
  adminNote: string | null;
  bannedReason: string | null;
  postCounts: {
    job: number;
    housing: number;
    marketplace: number;
    service: number;
    total: number;
  } | null;
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
  totals: {
    total: number;
    active: number;
    restricted: number;
    banned: number;
    pending: number;
  };
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
  private_metadata: unknown;
  created_at: string;
  updated_at: string;
};

const ADMIN_USERS_PAGE_SIZE = 20;

export async function getAdminUsersPermissions(): Promise<AdminUsersPermissions> {
  const [viewUsers, viewPosts, moderatePosts, manageUserStatus, restrictUsers, banUsers, restoreUsers, viewUserPosts, editUserNotes] = await Promise.all([
    hasAdminPermission("view_users"),
    hasAdminPermission("view_posts"),
    hasAdminPermission("moderate_posts"),
    hasAdminPermission("manage_user_status"),
    hasAdminPermission("restrict_users"),
    hasAdminPermission("ban_users"),
    hasAdminPermission("restore_users"),
    hasAdminPermission("view_user_posts"),
    hasAdminPermission("edit_user_notes"),
  ]);

  return { viewUsers, viewPosts, moderatePosts, manageUserStatus, restrictUsers, banUsers, restoreUsers, viewUserPosts, editUserNotes };
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
    .select("id,email,nickname,account_type,status,location_area,private_metadata,created_at,updated_at", { count: "exact" })
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
  const profiles = ((data ?? []) as ProfileRow[]).map(mapProfile);
  const usersWithCounts = await attachPostCounts(supabase, profiles, permissions);
  const totals = await getUserStatusTotals(supabase);

  return {
    state: "ready",
    permissions,
    users: usersWithCounts,
    totals,
    page,
    pageSize: ADMIN_USERS_PAGE_SIZE,
    totalCount,
    pageCount: Math.max(1, Math.ceil(totalCount / ADMIN_USERS_PAGE_SIZE)),
  };
}

function emptyResult(state: QueryState, permissions: AdminUsersPermissions, page: number): AdminUsersResult {
  return {
    state,
    permissions,
    users: [],
    totals: { total: 0, active: 0, restricted: 0, banned: 0, pending: 0 },
    page,
    pageSize: ADMIN_USERS_PAGE_SIZE,
    totalCount: 0,
    pageCount: 1,
  };
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
  const privateMetadata = isRecord(row.private_metadata) ? row.private_metadata : {};
  return {
    id: row.id,
    email: row.email,
    nickname: row.nickname,
    accountType: row.account_type,
    status: row.status,
    locationArea: row.location_area,
    adminNote: readMetadataString(privateMetadata.admin_note),
    bannedReason: readMetadataString(privateMetadata.banned_reason),
    postCounts: null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function attachPostCounts(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  users: AdminUserListItem[],
  permissions: AdminUsersPermissions,
) {
  if (users.length === 0 || !(permissions.viewUserPosts && (permissions.viewPosts || permissions.moderatePosts))) return users;
  const ids = users.map((user) => user.id);
  const { data, error } = await supabase.from("posts").select("author_id,post_type").in("author_id", ids).limit(5000);
  if (error || !data) return users;

  const countMap = new Map<string, NonNullable<AdminUserListItem["postCounts"]>>();
  for (const id of ids) {
    countMap.set(id, { job: 0, housing: 0, marketplace: 0, service: 0, total: 0 });
  }

  for (const row of data as Array<{ author_id: string | null; post_type: "job" | "housing" | "marketplace" | "service" }>) {
    if (!row.author_id) continue;
    const counts = countMap.get(row.author_id);
    if (!counts) continue;
    counts[row.post_type] += 1;
    counts.total += 1;
  }

  return users.map((user) => ({ ...user, postCounts: countMap.get(user.id) ?? null }));
}

async function getUserStatusTotals(supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>) {
  const [total, active, restricted, banned, pending] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "restricted"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "banned"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return {
    total: total.count ?? 0,
    active: active.count ?? 0,
    restricted: restricted.count ?? 0,
    banned: banned.count ?? 0,
    pending: pending.count ?? 0,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readMetadataString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
