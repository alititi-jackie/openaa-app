import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasAdminModule } from "@/lib/permissions/admin";
import { POST_TYPE_LABELS, POST_TYPE_TO_ROUTE } from "@/features/posts/constants";
import type { PostType } from "@/features/posts/types";
import { REPORT_REASON_LABELS, REPORT_AUTHOR_MESSAGE_TEMPLATES, type ReportReason } from "@/features/reports/types";
import { SUPPORT_TICKET_STATUS_LABELS, SUPPORT_TICKET_TYPE_LABELS, type SupportTicketStatus, type SupportTicketType } from "@/features/support/types";

export type MessageTab = "reports" | "feedback" | "contact-users";
export type ReportStatusTab = "open" | "resolved" | "deleted";
export type FeedbackStatusTab = "new" | "viewed" | "deleted";

export type AdminUserSummary = {
  id: string;
  nickname: string | null;
  email: string | null;
  phone: string | null;
  wechatId: string | null;
  whatsapp: string | null;
  status: string | null;
};

export type AdminMessageReport = {
  id: string;
  postId: string;
  postHref: string;
  postTitle: string;
  postTypeLabel: string;
  postStatusLabel: string;
  reason: ReportReason;
  reasonLabel: string;
  detail: string | null;
  contactInfo: string | null;
  reporter: AdminUserSummary | null;
  author: AdminUserSummary | null;
  handler: AdminUserSummary | null;
  createdAt: string;
  resolvedAt: string | null;
  status: ReportStatusTab;
  postAction: "none" | "hide" | "delete" | null;
  adminReason: ReportReason | null;
  adminReasonLabel: string | null;
  adminMessageEditable: string | null;
  adminMessageFixed: string | null;
  notifyAuthor: boolean;
  defaultAuthorMessage: string;
};

export type AdminFeedbackItem = {
  id: string;
  ticketNo: string;
  type: SupportTicketType;
  typeLabel: string;
  status: FeedbackStatusTab;
  statusLabel: string;
  content: string;
  contactInfo: string | null;
  relatedUrl: string | null;
  user: AdminUserSummary | null;
  createdAt: string;
};

export type AdminContactUser = AdminUserSummary;

export type AdminMessagesData = {
  state: "ready" | "missing_config" | "forbidden" | "error";
  error?: string;
  reports: {
    activeStatus: ReportStatusTab;
    totals: Record<ReportStatusTab, number>;
    items: AdminMessageReport[];
  };
  feedback: {
    activeStatus: FeedbackStatusTab;
    activeType: SupportTicketType | "all";
    totals: Record<FeedbackStatusTab, number>;
    items: AdminFeedbackItem[];
  };
  contactUsers: {
    q: string;
    mode: "recent" | "search";
    users: AdminContactUser[];
  };
};

type RawReport = {
  id: string;
  post_id: string;
  reporter_id: string | null;
  reason: string;
  detail: string | null;
  contact_info: string | null;
  status: string;
  handler_id: string | null;
  resolved_at: string | null;
  post_action: string | null;
  admin_reason: string | null;
  admin_message_editable: string | null;
  admin_message_fixed: string | null;
  notify_author: boolean | null;
  created_at: string;
  deleted_at: string | null;
  posts?: {
    id: string;
    post_type: PostType;
    title: string;
    status: string;
    author_id: string | null;
  }[] | {
    id: string;
    post_type: PostType;
    title: string;
    status: string;
    author_id: string | null;
  } | null;
};

type RawFeedback = {
  id: string;
  ticket_no: string;
  user_id: string | null;
  type: SupportTicketType;
  status: SupportTicketStatus;
  content: string;
  contact_info: string | null;
  related_url: string | null;
  created_at: string;
  deleted_at: string | null;
};

type RawProfile = {
  id: string;
  nickname: string | null;
  email: string | null;
  phone: string | null;
  wechat_id: string | null;
  whatsapp: string | null;
  status: string | null;
};

const emptyTotals = { open: 0, resolved: 0, deleted: 0 };
const emptyFeedbackTotals = { new: 0, viewed: 0, deleted: 0 };

export async function getAdminMessagesData({
  reportStatus = "open",
  feedbackStatus = "new",
  feedbackType = "all",
  q = "",
}: {
  reportStatus?: ReportStatusTab;
  feedbackStatus?: FeedbackStatusTab;
  feedbackType?: SupportTicketType | "all";
  q?: string;
} = {}): Promise<AdminMessagesData> {
  if (!(await hasAdminModule("messages"))) {
    return emptyResult("forbidden", reportStatus, feedbackStatus, feedbackType, q);
  }

  let supabase: ReturnType<typeof createSupabaseAdminClient>;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return emptyResult("missing_config", reportStatus, feedbackStatus, feedbackType, q, "Supabase service role 环境变量未配置。");
  }

  const [reports, feedback, contactUsers] = await Promise.all([
    readReports(supabase, reportStatus),
    readFeedback(supabase, feedbackStatus, feedbackType),
    searchUsers(supabase, q),
  ]);

  return {
    state: "ready",
    reports,
    feedback,
    contactUsers: { q, mode: q.trim().length >= 2 ? "search" : "recent", users: contactUsers },
  };
}

async function readReports(supabase: ReturnType<typeof createSupabaseAdminClient>, activeStatus: ReportStatusTab) {
  const [openCount, resolvedCount, deletedCount] = await Promise.all([
    countReports(supabase, "open"),
    countReports(supabase, "resolved"),
    countReports(supabase, "deleted"),
  ]);

  let query = supabase
    .from("post_reports")
    .select("id,post_id,reporter_id,reason,detail,contact_info,status,handler_id,resolved_at,post_action,admin_reason,admin_message_editable,admin_message_fixed,notify_author,created_at,deleted_at,posts(id,post_type,title,status,author_id)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (activeStatus === "deleted") {
    query = query.not("deleted_at", "is", null);
  } else if (activeStatus === "resolved") {
    query = query.is("deleted_at", null).eq("status", "resolved");
  } else {
    query = query.is("deleted_at", null).in("status", ["open", "in_review"]);
  }

  const { data } = await query;
  const rows = (data ?? []) as unknown as RawReport[];
  const userIds = rows.flatMap((row) => {
    const post = relationOne(row.posts);
    return [row.reporter_id, post?.author_id, row.handler_id];
  });
  const profiles = await readProfileMap(supabase, userIds);

  return {
    activeStatus,
    totals: { open: openCount, resolved: resolvedCount, deleted: deletedCount },
    items: rows.map((row) => mapReport(row, profiles, activeStatus)),
  };
}

async function readFeedback(supabase: ReturnType<typeof createSupabaseAdminClient>, activeStatus: FeedbackStatusTab, activeType: SupportTicketType | "all") {
  const [newCount, viewedCount, deletedCount] = await Promise.all([
    countFeedback(supabase, "new"),
    countFeedback(supabase, "viewed"),
    countFeedback(supabase, "deleted"),
  ]);

  let query = supabase
    .from("support_tickets")
    .select("id,ticket_no,user_id,type,status,content,contact_info,related_url,created_at,deleted_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (activeStatus === "deleted") {
    query = query.not("deleted_at", "is", null);
  } else {
    query = query.is("deleted_at", null).eq("status", activeStatus);
  }
  if (activeType !== "all") query = query.eq("type", activeType);

  const { data } = await query;
  const rows = (data ?? []) as RawFeedback[];
  const profiles = await readProfileMap(supabase, rows.map((row) => row.user_id));

  return {
    activeStatus,
    activeType,
    totals: { new: newCount, viewed: viewedCount, deleted: deletedCount },
    items: rows.map((row) => mapFeedback(row, profiles)),
  };
}

async function searchUsers(supabase: ReturnType<typeof createSupabaseAdminClient>, q: string) {
  const keyword = q.trim().replace(/[%_,]/g, "").slice(0, 80);
  if (keyword.length < 2) {
    const { data } = await supabase
      .from("profiles")
      .select("id,nickname,email,phone,wechat_id,whatsapp,status,created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(50);
    return ((data ?? []) as RawProfile[]).map(mapProfile);
  }

  let query = supabase.from("profiles").select("id,nickname,email,phone,wechat_id,whatsapp,status").eq("status", "active").limit(20);
  const filters = [`nickname.ilike.%${keyword}%`, `email.ilike.%${keyword}%`];
  if (isUuid(keyword)) filters.push(`id.eq.${keyword}`);
  query = query.or(filters.join(","));

  const { data } = await query;
  return ((data ?? []) as RawProfile[]).map(mapProfile);
}

async function countReports(supabase: ReturnType<typeof createSupabaseAdminClient>, status: ReportStatusTab) {
  let query = supabase.from("post_reports").select("id", { count: "exact", head: true });
  if (status === "deleted") query = query.not("deleted_at", "is", null);
  if (status === "resolved") query = query.is("deleted_at", null).eq("status", "resolved");
  if (status === "open") query = query.is("deleted_at", null).in("status", ["open", "in_review"]);
  const { count } = await query;
  return count ?? 0;
}

async function countFeedback(supabase: ReturnType<typeof createSupabaseAdminClient>, status: FeedbackStatusTab) {
  let query = supabase.from("support_tickets").select("id", { count: "exact", head: true });
  if (status === "deleted") query = query.not("deleted_at", "is", null);
  else query = query.is("deleted_at", null).eq("status", status);
  const { count } = await query;
  return count ?? 0;
}

async function readProfileMap(supabase: ReturnType<typeof createSupabaseAdminClient>, ids: Array<string | null | undefined>) {
  const userIds = Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
  if (userIds.length === 0) return new Map<string, AdminUserSummary>();
  const { data } = await supabase.from("profiles").select("id,nickname,email,phone,wechat_id,whatsapp,status").in("id", userIds);
  return new Map(((data ?? []) as RawProfile[]).map((profile) => [profile.id, mapProfile(profile)]));
}

function mapReport(row: RawReport, profiles: Map<string, AdminUserSummary>, fallbackStatus: ReportStatusTab): AdminMessageReport {
  const post = relationOne(row.posts);
  const postType = post?.post_type ?? "job";
  const reason = normalizeReportReason(row.reason);
  return {
    id: row.id,
    postId: row.post_id,
    postHref: post ? `${POST_TYPE_TO_ROUTE[post.post_type]}/${post.id}` : `/admin/user-posts?q=${encodeURIComponent(row.post_id)}`,
    postTitle: post?.title ?? "信息已不存在",
    postTypeLabel: POST_TYPE_LABELS[postType] ?? "发布信息",
    postStatusLabel: postStatusLabel(post?.status ?? "unknown"),
    reason,
    reasonLabel: REPORT_REASON_LABELS[reason],
    detail: row.detail,
    contactInfo: row.contact_info,
    reporter: row.reporter_id ? profiles.get(row.reporter_id) ?? null : null,
    author: post?.author_id ? profiles.get(post.author_id) ?? null : null,
    handler: row.handler_id ? profiles.get(row.handler_id) ?? null : null,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    status: row.deleted_at ? "deleted" : row.status === "resolved" ? "resolved" : fallbackStatus,
    postAction: normalizePostAction(row.post_action),
    adminReason: row.admin_reason ? normalizeReportReason(row.admin_reason) : null,
    adminReasonLabel: row.admin_reason ? REPORT_REASON_LABELS[normalizeReportReason(row.admin_reason)] : null,
    adminMessageEditable: row.admin_message_editable,
    adminMessageFixed: row.admin_message_fixed,
    notifyAuthor: Boolean(row.notify_author),
    defaultAuthorMessage: REPORT_AUTHOR_MESSAGE_TEMPLATES[reason],
  };
}

function mapFeedback(row: RawFeedback, profiles: Map<string, AdminUserSummary>): AdminFeedbackItem {
  const status: FeedbackStatusTab = row.deleted_at ? "deleted" : row.status === "viewed" || row.status === "processing" || row.status === "replied" || row.status === "closed" ? "viewed" : "new";
  return {
    id: row.id,
    ticketNo: row.ticket_no,
    type: row.type,
    typeLabel: SUPPORT_TICKET_TYPE_LABELS[row.type] ?? row.type,
    status,
    statusLabel: SUPPORT_TICKET_STATUS_LABELS[status],
    content: row.content,
    contactInfo: row.contact_info,
    relatedUrl: row.related_url,
    user: row.user_id ? profiles.get(row.user_id) ?? null : null,
    createdAt: row.created_at,
  };
}

function mapProfile(row: RawProfile): AdminUserSummary {
  return {
    id: row.id,
    nickname: row.nickname,
    email: row.email,
    phone: row.phone,
    wechatId: row.wechat_id,
    whatsapp: row.whatsapp,
    status: row.status,
  };
}

function relationOne<T>(value: T[] | T | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function normalizeReportReason(value: string): ReportReason {
  if (value === "false_information" || value === "invalid_contact" || value === "scam" || value === "expired" || value === "illegal" || value === "other") return value;
  return "other";
}

function postStatusLabel(value: string) {
  if (value === "published") return "显示中";
  if (value === "hidden") return "已下架";
  if (value === "deleted") return "已删除";
  if (value === "pending_review") return "待审核";
  if (value === "expired") return "已过期";
  return "未知状态";
}

function emptyResult(
  state: AdminMessagesData["state"],
  reportStatus: ReportStatusTab,
  feedbackStatus: FeedbackStatusTab,
  feedbackType: SupportTicketType | "all",
  q: string,
  error?: string,
): AdminMessagesData {
  return {
    state,
    error,
    reports: { activeStatus: reportStatus, totals: emptyTotals, items: [] },
    feedback: { activeStatus: feedbackStatus, activeType: feedbackType, totals: emptyFeedbackTotals, items: [] },
    contactUsers: { q, mode: q.trim().length >= 2 ? "search" : "recent", users: [] },
  };
}

function normalizePostAction(value: string | null): AdminMessageReport["postAction"] {
  if (value === "none" || value === "hide" || value === "delete") return value;
  return null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
