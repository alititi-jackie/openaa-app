import "server-only";

import { hasAdminPermission } from "@/lib/permissions/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_SUPPORT_TICKET_SETTINGS,
  SUPPORT_TICKET_PRIORITY_LABELS,
  SUPPORT_TICKET_STATUS_LABELS,
  SUPPORT_TICKET_TYPE_LABELS,
  isSupportTicketPriority,
  isSupportTicketStatus,
  isSupportTicketType,
  type SupportTicketPriority,
  type SupportTicketSettings,
  type SupportTicketStatus,
  type SupportTicketType,
} from "./types";

const PAGE_SIZE = 20;
const MAX_READ = 500;

export type AdminSupportPermissions = {
  viewSupportTickets: boolean;
  handleSupportTickets: boolean;
};

export type AdminSupportProfileContact = {
  userId: string;
  nickname: string | null;
  email: string | null;
  phone: string | null;
  wechatId: string | null;
  whatsapp: string | null;
  preferredContactMethod: string | null;
};

export type AdminSupportTicketItem = {
  id: string;
  ticketNo: string;
  userId: string | null;
  visitorId: string | null;
  type: SupportTicketType;
  typeLabel: string;
  source: string;
  targetType: string | null;
  targetId: string | null;
  relatedUrl: string | null;
  contactInfo: string | null;
  content: string;
  status: SupportTicketStatus;
  statusLabel: string;
  priority: SupportTicketPriority;
  priorityLabel: string;
  adminReply: string | null;
  adminNote: string | null;
  handledBy: string | null;
  handledByLabel: string | null;
  handledAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  profile: AdminSupportProfileContact | null;
};

export type AdminSupportData = {
  state: "ready" | "missing_config" | "error";
  error?: string;
  permissions: AdminSupportPermissions;
  tickets: AdminSupportTicketItem[];
  settings: SupportTicketSettings;
  totals: {
    total: number;
    pending: number;
    processing: number;
    replied: number;
    closed: number;
  };
  page: number;
  pageCount: number;
  pageSize: number;
  totalCount: number;
};

export type AdminSupportFilters = {
  status?: SupportTicketStatus | "all";
  type?: SupportTicketType | "all";
  priority?: SupportTicketPriority | "all";
  q?: string;
  sort?: "newest" | "oldest";
  page?: number;
};

export async function getAdminSupportData(filters: AdminSupportFilters = {}): Promise<AdminSupportData> {
  const permissions = await getAdminSupportPermissions();
  const page = Math.max(1, filters.page ?? 1);

  if (!permissions.viewSupportTickets) return emptyResult("ready", permissions, page);

  let supabase: ReturnType<typeof createSupabaseAdminClient>;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return emptyResult("missing_config", permissions, page, "Supabase service role 环境变量未配置，暂时无法读取反馈与举报管理。");
  }

  let query = supabase
    .from("support_tickets")
    .select("id,ticket_no,user_id,visitor_id,type,source,target_type,target_id,related_url,contact_info,content,status,priority,admin_reply,admin_note,handled_by,handled_at,closed_at,created_at,updated_at", { count: "exact" })
    .is("deleted_at", null);

  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.type && filters.type !== "all") query = query.eq("type", filters.type);
  if (filters.priority && filters.priority !== "all") query = query.eq("priority", filters.priority);

  const sortAscending = filters.sort === "oldest";
  const { data, error, count } = await query.order("created_at", { ascending: sortAscending }).limit(MAX_READ);
  if (error) return emptyResult("error", permissions, page, "反馈与举报列表读取失败，请稍后再试。");

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const profileMap = await fetchProfiles(
    supabase,
    rows.flatMap((row) => [stringOrNull(row.user_id), stringOrNull(row.handled_by)]),
  );

  const keyword = sanitizeSearchTerm(filters.q ?? "");
  const mapped = rows.map((row) => mapTicket(row, profileMap));
  const filtered = keyword ? mapped.filter((ticket) => matchesKeyword(ticket, keyword)) : mapped;
  const totalCount = keyword ? filtered.length : count ?? filtered.length;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  const [settings, totals] = await Promise.all([getSupportTicketSettings(supabase), getSupportTicketTotals(supabase)]);

  return {
    state: "ready",
    permissions,
    tickets: filtered.slice(start, start + PAGE_SIZE),
    settings,
    totals,
    page: safePage,
    pageCount,
    pageSize: PAGE_SIZE,
    totalCount,
  };
}

export async function getAdminSupportPermissions(): Promise<AdminSupportPermissions> {
  const [viewSupportTickets, handleSupportTickets] = await Promise.all([
    hasAdminPermission("view_support_tickets"),
    hasAdminPermission("handle_support_tickets"),
  ]);
  return {
    viewSupportTickets: viewSupportTickets || handleSupportTickets,
    handleSupportTickets,
  };
}

export async function getSupportTicketSettings(supabase: ReturnType<typeof createSupabaseAdminClient>): Promise<SupportTicketSettings> {
  const { data } = await supabase.from("support_ticket_settings").select("key,value");
  const values = new Map((data ?? []).map((row: { key: string; value: string }) => [row.key, row.value]));
  return {
    enabled: parseBoolean(values.get("enabled"), DEFAULT_SUPPORT_TICKET_SETTINGS.enabled),
    dailyUserLimit: parseLimit(values.get("daily_user_limit"), DEFAULT_SUPPORT_TICKET_SETTINGS.dailyUserLimit, 1, 1000),
    dailyVisitorLimit: parseLimit(values.get("daily_visitor_limit"), DEFAULT_SUPPORT_TICKET_SETTINGS.dailyVisitorLimit, 1, 1000),
    dailyTotalLimit: parseLimit(values.get("daily_total_limit"), DEFAULT_SUPPORT_TICKET_SETTINGS.dailyTotalLimit, 1, 10000),
    contentMinLength: parseLimit(values.get("content_min_length"), DEFAULT_SUPPORT_TICKET_SETTINGS.contentMinLength, 1, 1000),
    contentMaxLength: parseLimit(values.get("content_max_length"), DEFAULT_SUPPORT_TICKET_SETTINGS.contentMaxLength, 10, 20000),
    contactMaxLength: parseLimit(values.get("contact_max_length"), DEFAULT_SUPPORT_TICKET_SETTINGS.contactMaxLength, 1, 1000),
    relatedUrlMaxLength: parseLimit(values.get("related_url_max_length"), DEFAULT_SUPPORT_TICKET_SETTINGS.relatedUrlMaxLength, 1, 2000),
  };
}

export function normalizeSupportStatusFilter(value?: string): SupportTicketStatus | "all" | undefined {
  if (value === "all") return "all";
  return value && isSupportTicketStatus(value) ? value : undefined;
}

export function normalizeSupportTypeFilter(value?: string): SupportTicketType | "all" | undefined {
  if (value === "all") return "all";
  return value && isSupportTicketType(value) ? value : undefined;
}

export function normalizeSupportPriorityFilter(value?: string): SupportTicketPriority | "all" | undefined {
  if (value === "all") return "all";
  return value && isSupportTicketPriority(value) ? value : undefined;
}

export function normalizeSupportSort(value?: string): "newest" | "oldest" | undefined {
  return value === "oldest" ? "oldest" : value === "newest" ? "newest" : undefined;
}

async function fetchProfiles(supabase: ReturnType<typeof createSupabaseAdminClient>, ids: Array<string | null>) {
  const uniqueIds = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (uniqueIds.length === 0) return new Map<string, AdminSupportProfileContact>();

  const { data } = await supabase
    .from("profiles")
    .select("id,nickname,email,phone,wechat_id,whatsapp,preferred_contact_method")
    .in("id", uniqueIds);

  return new Map(
    ((data ?? []) as Array<Record<string, unknown>>).map((row) => [
      String(row.id),
      {
        userId: String(row.id),
        nickname: stringOrNull(row.nickname),
        email: stringOrNull(row.email),
        phone: stringOrNull(row.phone),
        wechatId: stringOrNull(row.wechat_id),
        whatsapp: stringOrNull(row.whatsapp),
        preferredContactMethod: stringOrNull(row.preferred_contact_method),
      },
    ]),
  );
}

async function getSupportTicketTotals(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  const [total, pending, processing, replied, closed] = await Promise.all([
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("status", "pending"),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("status", "processing"),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("status", "replied"),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("status", "closed"),
  ]);
  return {
    total: total.count ?? 0,
    pending: pending.count ?? 0,
    processing: processing.count ?? 0,
    replied: replied.count ?? 0,
    closed: closed.count ?? 0,
  };
}

function mapTicket(row: Record<string, unknown>, profileMap: Map<string, AdminSupportProfileContact>): AdminSupportTicketItem {
  const type = isSupportTicketType(String(row.type)) ? (row.type as SupportTicketType) : "other";
  const status = isSupportTicketStatus(String(row.status)) ? (row.status as SupportTicketStatus) : "pending";
  const priority = isSupportTicketPriority(String(row.priority)) ? (row.priority as SupportTicketPriority) : "normal";
  const userId = stringOrNull(row.user_id);
  const handledBy = stringOrNull(row.handled_by);
  const handler = handledBy ? profileMap.get(handledBy) : null;
  return {
    id: String(row.id),
    ticketNo: String(row.ticket_no),
    userId,
    visitorId: stringOrNull(row.visitor_id),
    type,
    typeLabel: SUPPORT_TICKET_TYPE_LABELS[type],
    source: String(row.source ?? "feedback_page"),
    targetType: stringOrNull(row.target_type),
    targetId: stringOrNull(row.target_id),
    relatedUrl: stringOrNull(row.related_url),
    contactInfo: stringOrNull(row.contact_info),
    content: String(row.content ?? ""),
    status,
    statusLabel: SUPPORT_TICKET_STATUS_LABELS[status],
    priority,
    priorityLabel: SUPPORT_TICKET_PRIORITY_LABELS[priority],
    adminReply: stringOrNull(row.admin_reply),
    adminNote: stringOrNull(row.admin_note),
    handledBy,
    handledByLabel: handler ? profileLabel(handler, handledBy) : handledBy,
    handledAt: stringOrNull(row.handled_at),
    closedAt: stringOrNull(row.closed_at),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
    profile: userId ? profileMap.get(userId) ?? null : null,
  };
}

function matchesKeyword(ticket: AdminSupportTicketItem, keyword: string) {
  const haystack = [
    ticket.ticketNo,
    ticket.content,
    ticket.contactInfo,
    ticket.relatedUrl,
    ticket.userId,
    ticket.visitorId,
    ticket.profile?.nickname,
    ticket.profile?.email,
    ticket.profile?.phone,
    ticket.profile?.wechatId,
    ticket.profile?.whatsapp,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(keyword.toLowerCase());
}

function profileLabel(profile: AdminSupportProfileContact, fallbackId?: string | null) {
  if (profile.nickname && profile.email) return `${profile.nickname} / ${profile.email}`;
  if (profile.nickname) return profile.nickname;
  if (profile.email) return profile.email;
  return fallbackId ?? "未知用户";
}

function emptyResult(
  state: AdminSupportData["state"],
  permissions: AdminSupportPermissions,
  page: number,
  error?: string,
): AdminSupportData {
  return {
    state,
    error,
    permissions,
    tickets: [],
    settings: DEFAULT_SUPPORT_TICKET_SETTINGS,
    totals: { total: 0, pending: 0, processing: 0, replied: 0, closed: 0 },
    page,
    pageCount: 1,
    pageSize: PAGE_SIZE,
    totalCount: 0,
  };
}

function sanitizeSearchTerm(value: string) {
  return value.trim().replace(/[%_,]/g, "").slice(0, 80);
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function parseLimit(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

