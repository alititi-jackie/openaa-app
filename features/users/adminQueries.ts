import "server-only";

import { hasAdminPermission } from "@/lib/permissions/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileStatus } from "@/lib/supabase/types";
import type { QueryState } from "@/features/posts/types";

export type AdminUsersPermissions = {
  viewUsers: boolean;
  viewUserContacts: boolean;
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
  emailVerified: boolean;
  nickname: string | null;
  accountType: string;
  status: ProfileStatus;
  phone: string | null;
  wechatId: string | null;
  whatsapp: string | null;
  preferredContactMethod: string | null;
  locationArea: string | null;
  trustLevel: number;
  isVerifiedUser: boolean;
  adminNote: string | null;
  bannedReason: string | null;
  postCounts: {
    job: number;
    housing: number;
    marketplace: number;
    service: number;
    total: number;
  } | null;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminUsersParams = {
  status?: ProfileStatus | "all";
  accountType?: "all" | "personal" | "business";
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
  currentAdminId: string | null;
  error?: string;
};

type ProfileRow = {
  id: string;
  email: string | null;
  email_verified: boolean;
  nickname: string | null;
  account_type: string;
  status: ProfileStatus;
  phone: string | null;
  wechat_id: string | null;
  whatsapp: string | null;
  preferred_contact_method: string | null;
  location_area: string | null;
  trust_level: number;
  is_verified_user: boolean;
  private_metadata: unknown;
  last_login_at: string | null;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
};

const ADMIN_USERS_PAGE_SIZE = 20;

export async function getAdminUsersPermissions(): Promise<AdminUsersPermissions> {
  const [viewUsers, viewUserContacts, viewPosts, moderatePosts, manageUserStatus, restrictUsers, banUsers, restoreUsers, viewUserPosts, editUserNotes] = await Promise.all([
    hasAdminPermission("view_users"),
    hasAdminPermission("view_user_contacts"),
    hasAdminPermission("view_posts"),
    hasAdminPermission("moderate_posts"),
    hasAdminPermission("manage_user_status"),
    hasAdminPermission("restrict_users"),
    hasAdminPermission("ban_users"),
    hasAdminPermission("restore_users"),
    hasAdminPermission("view_user_posts"),
    hasAdminPermission("edit_user_notes"),
  ]);

  return { viewUsers, viewUserContacts, viewPosts, moderatePosts, manageUserStatus, restrictUsers, banUsers, restoreUsers, viewUserPosts, editUserNotes };
}

export async function getAdminUsersData(params: AdminUsersParams = {}): Promise<AdminUsersResult> {
  const supabase = await createSupabaseServerClient();
  const permissions = await getAdminUsersPermissions();
  const page = normalizePage(params.page);
  const from = (page - 1) * ADMIN_USERS_PAGE_SIZE;
  const to = from + ADMIN_USERS_PAGE_SIZE - 1;

  if (!supabase) {
    return emptyResult("missing_config", permissions, page, null);
  }

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  const currentAdminId = currentUser?.id ?? null;

  if (!permissions.viewUsers) {
    return emptyResult("ready", permissions, page, currentAdminId);
  }

  let query = supabase
    .from("profiles")
    .select("id,email,email_verified,nickname,account_type,status,phone,wechat_id,whatsapp,preferred_contact_method,location_area,trust_level,is_verified_user,private_metadata,last_login_at,last_active_at,created_at,updated_at", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  if (params.accountType && params.accountType !== "all") {
    query = query.eq("account_type", params.accountType);
  }

  const keyword = sanitizeSearchTerm(params.q ?? "");
  if (keyword) {
    const filters = [`email.ilike.%${keyword}%`, `nickname.ilike.%${keyword}%`];
    if (permissions.viewUserContacts) {
      filters.push(`phone.ilike.%${keyword}%`, `wechat_id.ilike.%${keyword}%`, `whatsapp.ilike.%${keyword}%`);
    }
    if (isUuid(keyword)) filters.push(`id.eq.${keyword}`);
    query = query.or(filters.join(","));
  }

  const { data, error, count } = await query;
  if (error) {
    return { ...emptyResult("error", permissions, page, currentAdminId), error: "后台用户读取失败，请稍后再试。" };
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
    currentAdminId,
  };
}

function emptyResult(state: QueryState, permissions: AdminUsersPermissions, page: number, currentAdminId: string | null): AdminUsersResult {
  return {
    state,
    permissions,
    users: [],
    totals: { total: 0, active: 0, restricted: 0, banned: 0, pending: 0 },
    page,
    pageSize: ADMIN_USERS_PAGE_SIZE,
    totalCount: 0,
    pageCount: 1,
    currentAdminId,
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
    emailVerified: row.email_verified,
    nickname: row.nickname,
    accountType: row.account_type,
    status: row.status,
    phone: row.phone,
    wechatId: row.wechat_id,
    whatsapp: row.whatsapp,
    preferredContactMethod: row.preferred_contact_method,
    locationArea: row.location_area,
    trustLevel: row.trust_level,
    isVerifiedUser: row.is_verified_user,
    adminNote: readMetadataString(privateMetadata.admin_note),
    bannedReason: readMetadataString(privateMetadata.banned_reason),
    postCounts: null,
    lastLoginAt: row.last_login_at,
    lastActiveAt: row.last_active_at,
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
