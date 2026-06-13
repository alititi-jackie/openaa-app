import "server-only";

import { hasAdminPermission } from "@/lib/permissions/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { FEEDBACK_STATUS_LABELS, FEEDBACK_STATUS_PRIORITY, FEEDBACK_TYPES, isFeedbackStatus, type FeedbackStatus } from "./types";

const PAGE_SIZE = 20;
const DEFAULT_USER_DAILY_LIMIT = 5;
const DEFAULT_TOTAL_DAILY_LIMIT = 100;

export type AdminFeedbackListItem = {
  id: string;
  userId: string | null;
  visitorId: string | null;
  type: string;
  contact: string | null;
  relatedUrl: string | null;
  content: string;
  status: FeedbackStatus;
  statusLabel: string;
  adminNote: string | null;
  handledBy: string | null;
  handledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminFeedbackPermissions = {
  viewFeedback: boolean;
  handleFeedback: boolean;
};

export type AdminFeedbackSettings = {
  userDailyLimit: number;
  totalDailyLimit: number;
};

export type AdminFeedbackData = {
  state: "ready" | "missing_config" | "error";
  error?: string;
  permissions: AdminFeedbackPermissions;
  feedback: AdminFeedbackListItem[];
  totals: { total: number; pending: number; processed: number };
  settings: AdminFeedbackSettings;
  page: number;
  pageCount: number;
  pageSize: number;
  totalCount: number;
};

type AdminFeedbackFilters = {
  status?: FeedbackStatus | "all";
  type?: string;
  q?: string;
  page?: number;
};

export async function getAdminFeedbackData(filters: AdminFeedbackFilters = {}): Promise<AdminFeedbackData> {
  const permissions = await getAdminFeedbackPermissions();
  const page = Math.max(1, filters.page ?? 1);

  if (!permissions.viewFeedback) return emptyResult("ready", permissions, page);

  let supabase: ReturnType<typeof createSupabaseAdminClient>;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return emptyResult("missing_config", permissions, page, "Supabase service role 环境变量未配置，暂时无法读取反馈后台。");
  }

  let query = supabase
    .from("feedback_posts")
    .select("id,user_id,visitor_id,type,contact,related_url,content,status,admin_note,handled_by,handled_at,created_at,updated_at", { count: "exact" })
    .is("deleted_at", null);

  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.type && filters.type !== "all") query = query.eq("type", filters.type);
  const search = filters.q?.trim();
  if (search) {
    const escaped = search.replaceAll("%", "\\%").replaceAll("_", "\\_");
    query = query.or(`content.ilike.%${escaped}%,contact.ilike.%${escaped}%,related_url.ilike.%${escaped}%`);
  }

  const { data, error, count } = await query.order("created_at", { ascending: false }).limit(500);
  if (error) return emptyResult("error", permissions, page, "反馈后台读取失败，请稍后再试。");

  const mapped = ((data ?? []) as Array<Record<string, unknown>>).map(mapFeedback).sort(compareFeedback);
  const totalCount = count ?? mapped.length;
  const pageCount = Math.max(1, Math.ceil(mapped.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  const [totals, settings] = await Promise.all([getFeedbackTotals(supabase), getFeedbackSettings(supabase)]);

  return {
    state: "ready",
    permissions,
    feedback: mapped.slice(start, start + PAGE_SIZE),
    totals,
    settings,
    page: safePage,
    pageCount,
    pageSize: PAGE_SIZE,
    totalCount,
  };
}

export function normalizeFeedbackStatus(value?: string): FeedbackStatus | "all" | undefined {
  if (value === "all") return "all";
  if (value && isFeedbackStatus(value)) return value;
  return undefined;
}

export function normalizeFeedbackTypeFilter(value?: string): string | "all" | undefined {
  if (value === "all") return "all";
  if (value && FEEDBACK_TYPES.includes(value as (typeof FEEDBACK_TYPES)[number])) return value;
  return undefined;
}

async function getAdminFeedbackPermissions(): Promise<AdminFeedbackPermissions> {
  const [viewFeedback, handleFeedback] = await Promise.all([
    hasAdminPermission("view_feedback"),
    hasAdminPermission("handle_feedback"),
  ]);
  return {
    viewFeedback: viewFeedback || handleFeedback,
    handleFeedback,
  };
}

async function getFeedbackTotals(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  const [total, pending, resolved, ignored] = await Promise.all([
    supabase.from("feedback_posts").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("feedback_posts").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("status", "pending"),
    supabase.from("feedback_posts").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("status", "resolved"),
    supabase.from("feedback_posts").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("status", "ignored"),
  ]);
  return {
    total: total.count ?? 0,
    pending: pending.count ?? 0,
    processed: (resolved.count ?? 0) + (ignored.count ?? 0),
  };
}

async function getFeedbackSettings(supabase: ReturnType<typeof createSupabaseAdminClient>): Promise<AdminFeedbackSettings> {
  const { data } = await supabase.from("feedback_settings").select("key,value").in("key", ["feedback_daily_user_limit", "feedback_daily_total_limit"]);
  const rows = (data ?? []) as Array<{ key: string; value: number | null }>;
  return {
    userDailyLimit: normalizeLimit(rows.find((row) => row.key === "feedback_daily_user_limit")?.value, DEFAULT_USER_DAILY_LIMIT),
    totalDailyLimit: normalizeLimit(rows.find((row) => row.key === "feedback_daily_total_limit")?.value, DEFAULT_TOTAL_DAILY_LIMIT),
  };
}

function normalizeLimit(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 1000 ? parsed : fallback;
}

function mapFeedback(row: Record<string, unknown>): AdminFeedbackListItem {
  const status = isFeedbackStatus(String(row.status)) ? (row.status as FeedbackStatus) : "pending";
  return {
    id: String(row.id),
    userId: typeof row.user_id === "string" ? row.user_id : null,
    visitorId: typeof row.visitor_id === "string" ? row.visitor_id : null,
    type: typeof row.type === "string" ? row.type : "其它问题",
    contact: typeof row.contact === "string" ? row.contact : null,
    relatedUrl: typeof row.related_url === "string" ? row.related_url : null,
    content: typeof row.content === "string" ? row.content : "",
    status,
    statusLabel: FEEDBACK_STATUS_LABELS[status],
    adminNote: typeof row.admin_note === "string" ? row.admin_note : null,
    handledBy: typeof row.handled_by === "string" ? row.handled_by : null,
    handledAt: typeof row.handled_at === "string" ? row.handled_at : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : "",
  };
}

function compareFeedback(a: AdminFeedbackListItem, b: AdminFeedbackListItem) {
  const statusDiff = FEEDBACK_STATUS_PRIORITY[a.status] - FEEDBACK_STATUS_PRIORITY[b.status];
  if (statusDiff !== 0) return statusDiff;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function emptyResult(
  state: AdminFeedbackData["state"],
  permissions: AdminFeedbackPermissions,
  page: number,
  error?: string,
): AdminFeedbackData {
  return {
    state,
    error,
    permissions,
    feedback: [],
    totals: { total: 0, pending: 0, processed: 0 },
    settings: { userDailyLimit: DEFAULT_USER_DAILY_LIMIT, totalDailyLimit: DEFAULT_TOTAL_DAILY_LIMIT },
    page,
    pageCount: 1,
    pageSize: PAGE_SIZE,
    totalCount: 0,
  };
}
