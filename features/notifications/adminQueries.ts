import "server-only";

import { hasAdminPermission } from "@/lib/permissions/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

export type NotificationReadFilter = "all" | "unread" | "read";
export type NotificationTypeFilter = "all" | "system" | "announcement" | "account" | "content" | "favorite" | "dmv";

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  system: "系统",
  announcement: "公告",
  account: "账号",
  content: "内容",
  favorite: "收藏",
  dmv: "DMV",
};

export const notificationTypeOptions: Array<{ value: NotificationTypeFilter; label: string }> = [
  { value: "all", label: "全部类型" },
  { value: "system", label: NOTIFICATION_TYPE_LABELS.system },
  { value: "announcement", label: NOTIFICATION_TYPE_LABELS.announcement },
  { value: "account", label: NOTIFICATION_TYPE_LABELS.account },
  { value: "content", label: NOTIFICATION_TYPE_LABELS.content },
  { value: "favorite", label: NOTIFICATION_TYPE_LABELS.favorite },
  { value: "dmv", label: NOTIFICATION_TYPE_LABELS.dmv },
];

export type AdminNotificationListItem = {
  id: string;
  userId: string;
  type: string;
  typeLabel: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export type AdminNotificationsData = {
  state: "ready" | "missing_config" | "error";
  error?: string;
  canManageNotifications: boolean;
  notifications: AdminNotificationListItem[];
  totals: { total: number; unread: number; read: number };
  page: number;
  pageCount: number;
  pageSize: number;
  totalCount: number;
};

type AdminNotificationsFilters = {
  type?: NotificationTypeFilter;
  read?: NotificationReadFilter;
  q?: string;
  page?: number;
};

export async function getAdminNotificationsData(filters: AdminNotificationsFilters = {}): Promise<AdminNotificationsData> {
  const supabase = await createSupabaseServerClient();
  const canManageNotifications = await hasAdminPermission("manage_notifications");
  const page = Math.max(1, filters.page ?? 1);

  if (!canManageNotifications) return emptyResult("ready", false, page);
  if (!supabase) return emptyResult("missing_config", canManageNotifications, page, "Supabase 环境变量未配置，暂时无法读取通知后台。");

  let query = supabase
    .from("notifications")
    .select("id,user_id,type,title,body,link_url,data,read_at,created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.type && filters.type !== "all") query = query.eq("type", filters.type);
  if (filters.read === "read") query = query.not("read_at", "is", null);
  if (filters.read === "unread") query = query.is("read_at", null);
  const search = filters.q?.trim();
  if (search) {
    const escaped = search.replaceAll("%", "\\%").replaceAll("_", "\\_");
    query = query.or(`title.ilike.%${escaped}%,body.ilike.%${escaped}%,user_id.eq.${escaped}`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, error, count } = await query.range(from, to);
  if (error) return emptyResult("error", canManageNotifications, page, "通知后台读取失败，请稍后再试。");

  const totals = await getNotificationTotals(supabase);
  const totalCount = count ?? 0;

  return {
    state: "ready",
    canManageNotifications,
    notifications: (data ?? []).map(mapNotification),
    totals,
    page,
    pageCount: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    pageSize: PAGE_SIZE,
    totalCount,
  };
}

export function normalizeNotificationReadFilter(value?: string): NotificationReadFilter | undefined {
  if (value === "all" || value === "read" || value === "unread") return value;
  return undefined;
}

export function normalizeNotificationTypeFilter(value?: string): NotificationTypeFilter | undefined {
  if (value === "all" || value === "system" || value === "announcement" || value === "account" || value === "content" || value === "favorite" || value === "dmv") return value;
  return undefined;
}

async function getNotificationTotals(supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>) {
  const [total, unread, read] = await Promise.all([
    supabase.from("notifications").select("id", { count: "exact", head: true }),
    supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
    supabase.from("notifications").select("id", { count: "exact", head: true }).not("read_at", "is", null),
  ]);

  return {
    total: total.count ?? 0,
    unread: unread.count ?? 0,
    read: read.count ?? 0,
  };
}

function mapNotification(row: Record<string, unknown>): AdminNotificationListItem {
  const type = typeof row.type === "string" && row.type ? row.type : "system";
  return {
    id: String(row.id),
    userId: String(row.user_id),
    type,
    typeLabel: NOTIFICATION_TYPE_LABELS[type] ?? type,
    title: typeof row.title === "string" ? row.title : "未命名通知",
    body: typeof row.body === "string" ? row.body : null,
    linkUrl: typeof row.link_url === "string" ? row.link_url : null,
    data: row.data && typeof row.data === "object" && !Array.isArray(row.data) ? (row.data as Record<string, unknown>) : {},
    readAt: typeof row.read_at === "string" ? row.read_at : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
  };
}

function emptyResult(
  state: AdminNotificationsData["state"],
  canManageNotifications: boolean,
  page: number,
  error?: string,
): AdminNotificationsData {
  return {
    state,
    error,
    canManageNotifications,
    notifications: [],
    totals: { total: 0, unread: 0, read: 0 },
    page,
    pageCount: 1,
    pageSize: PAGE_SIZE,
    totalCount: 0,
  };
}
