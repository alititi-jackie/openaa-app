import "server-only";

import { hasAdminPermission } from "@/lib/permissions/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FEEDBACK_CATEGORY_LABELS, FEEDBACK_STATUS_LABELS, isFeedbackStatus, type FeedbackStatus } from "./types";

const PAGE_SIZE = 20;

export type AdminFeedbackListItem = {
  id: string;
  userId: string | null;
  email: string | null;
  category: string;
  categoryLabel: string;
  subject: string;
  message: string;
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

export type AdminFeedbackData = {
  state: "ready" | "missing_config" | "error";
  error?: string;
  permissions: AdminFeedbackPermissions;
  feedback: AdminFeedbackListItem[];
  totals: { total: number; open: number; processed: number };
  page: number;
  pageCount: number;
  pageSize: number;
  totalCount: number;
};

type AdminFeedbackFilters = {
  status?: FeedbackStatus | "all";
  category?: string;
  q?: string;
  page?: number;
};

export async function getAdminFeedbackData(filters: AdminFeedbackFilters = {}): Promise<AdminFeedbackData> {
  const supabase = await createSupabaseServerClient();
  const permissions = await getAdminFeedbackPermissions();
  const page = Math.max(1, filters.page ?? 1);

  if (!permissions.viewFeedback) return emptyResult("ready", permissions, page);
  if (!supabase) return emptyResult("missing_config", permissions, page, "Supabase 环境变量未配置，暂时无法读取反馈后台。");

  let query = supabase
    .from("feedback")
    .select("id,user_id,email,category,subject,message,status,admin_note,handled_by,handled_at,created_at,updated_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.category && filters.category !== "all") query = query.eq("category", filters.category);
  const search = filters.q?.trim();
  if (search) {
    const escaped = search.replaceAll("%", "\\%").replaceAll("_", "\\_");
    query = query.or(`subject.ilike.%${escaped}%,message.ilike.%${escaped}%,email.ilike.%${escaped}%`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, error, count } = await query.range(from, to);

  if (error) return emptyResult("error", permissions, page, "反馈后台读取失败，请稍后再试。");

  const totals = await getFeedbackTotals(supabase);
  const totalCount = count ?? 0;

  return {
    state: "ready",
    permissions,
    feedback: (data ?? []).map(mapFeedback),
    totals,
    page,
    pageCount: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    pageSize: PAGE_SIZE,
    totalCount,
  };
}

export function normalizeFeedbackStatus(value?: string): FeedbackStatus | "all" | undefined {
  if (value === "all") return "all";
  if (value && isFeedbackStatus(value)) return value;
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

async function getFeedbackTotals(supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>) {
  const [total, open, resolved, closed] = await Promise.all([
    supabase.from("feedback").select("id", { count: "exact", head: true }),
    supabase.from("feedback").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("feedback").select("id", { count: "exact", head: true }).eq("status", "resolved"),
    supabase.from("feedback").select("id", { count: "exact", head: true }).eq("status", "closed"),
  ]);
  return {
    total: total.count ?? 0,
    open: open.count ?? 0,
    processed: (resolved.count ?? 0) + (closed.count ?? 0),
  };
}

function mapFeedback(row: Record<string, unknown>): AdminFeedbackListItem {
  const status = isFeedbackStatus(String(row.status)) ? (row.status as FeedbackStatus) : "open";
  const category = typeof row.category === "string" && row.category ? row.category : "other";
  return {
    id: String(row.id),
    userId: typeof row.user_id === "string" ? row.user_id : null,
    email: typeof row.email === "string" ? row.email : null,
    category,
    categoryLabel: FEEDBACK_CATEGORY_LABELS[category] ?? category,
    subject: typeof row.subject === "string" ? row.subject : "未命名反馈",
    message: typeof row.message === "string" ? row.message : "",
    status,
    statusLabel: FEEDBACK_STATUS_LABELS[status],
    adminNote: typeof row.admin_note === "string" ? row.admin_note : null,
    handledBy: typeof row.handled_by === "string" ? row.handled_by : null,
    handledAt: typeof row.handled_at === "string" ? row.handled_at : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : "",
  };
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
    totals: { total: 0, open: 0, processed: 0 },
    page,
    pageCount: 1,
    pageSize: PAGE_SIZE,
    totalCount: 0,
  };
}
