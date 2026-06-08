import "server-only";

import { hasAdminPermission } from "@/lib/permissions/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { POST_TYPE_LABELS, POST_TYPE_TO_ROUTE } from "@/features/posts/constants";
import { postStatusLabel } from "@/features/posts/display";
import type { PostStatus, PostType, QueryState } from "@/features/posts/types";

export type ReportStatus = "open" | "in_review" | "resolved" | "rejected";
export type ReportFilterStatus = ReportStatus | "dismissed" | "all";
export type ReportReason = "false_information" | "expired" | "scam" | "invalid_contact" | "illegal" | "other";

export type AdminReportsPermissions = {
  viewReports: boolean;
  manageReports: boolean;
  moderatePosts: boolean;
};

export type AdminReportListItem = {
  id: string;
  postId: string;
  postType: PostType;
  postTypeLabel: string;
  postStatus: PostStatus;
  postStatusLabel: string;
  postTitle: string;
  postHref: string;
  authorId: string | null;
  authorLabel: string;
  reporterId: string | null;
  reporterLabel: string;
  reason: string;
  reasonLabel: string;
  detail: string | null;
  status: ReportStatus;
  statusLabel: string;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminReportsData = {
  state: QueryState;
  permissions: AdminReportsPermissions;
  reports: AdminReportListItem[];
  totals: {
    total: number;
    open: number;
    processed: number;
  };
  page: number;
  pageSize: number;
  totalCount: number;
  pageCount: number;
  error?: string;
};

export type AdminReportsParams = {
  status?: ReportFilterStatus;
  type?: PostType | "all";
  reason?: ReportReason | "all";
  q?: string;
  page?: number;
};

type RawReport = {
  id: string;
  post_id: string;
  reporter_id: string | null;
  reason: string;
  detail: string | null;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
  posts?: {
    id: string;
    post_type: PostType;
    title: string;
    status: PostStatus;
    author_id: string | null;
    post_stats?: { report_count: number | null }[] | { report_count: number | null } | null;
  } | null;
};

type ProfileSummary = {
  id: string;
  email: string | null;
  nickname: string | null;
};

const ADMIN_REPORTS_PAGE_SIZE = 20;
const MAX_REPORTS_READ = 500;

export const REPORT_REASON_LABELS: Record<string, string> = {
  false_information: "虚假信息",
  expired: "已过期",
  scam: "诈骗/可疑",
  invalid_contact: "联系方式无效",
  illegal: "违法/违规",
  other: "其它",
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: "未处理",
  in_review: "处理中",
  resolved: "已处理",
  rejected: "已驳回",
};

export async function getAdminReportsPermissions(): Promise<AdminReportsPermissions> {
  const [viewPostReports, handlePostReports, viewReports, handleReports, moderatePosts] = await Promise.all([
    hasAdminPermission("view_post_reports"),
    hasAdminPermission("handle_post_reports"),
    hasAdminPermission("view_reports"),
    hasAdminPermission("handle_reports"),
    hasAdminPermission("moderate_posts"),
  ]);

  return {
    viewReports: viewPostReports || handlePostReports || viewReports || handleReports || moderatePosts,
    manageReports: handlePostReports || handleReports,
    moderatePosts,
  };
}

export async function getAdminReportsData(params: AdminReportsParams = {}): Promise<AdminReportsData> {
  const permissions = await getAdminReportsPermissions();
  const page = normalizePage(params.page);

  if (!permissions.viewReports) {
    return emptyResult("ready", permissions, page);
  }

  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return { ...emptyResult("missing_config", permissions, page), error: "Supabase service role 环境变量尚未配置，暂时无法读取举报后台。" };
  }

  const totals = await getReportTotals(supabase);

  let query = supabase
    .from("post_reports")
    .select(
      `
        id,
        post_id,
        reporter_id,
        reason,
        detail,
        status,
        created_at,
        updated_at,
        posts!inner(
          id,
          post_type,
          title,
          status,
          author_id,
          post_stats(report_count)
        )
      `,
    )
    .order("created_at", { ascending: false })
    .limit(MAX_REPORTS_READ);

  const status = normalizeReportStatus(params.status);
  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (params.type && params.type !== "all") {
    query = query.eq("posts.post_type", params.type);
  }

  if (params.reason && params.reason !== "all") {
    query = query.eq("reason", params.reason);
  }

  const { data, error } = await query;
  if (error) {
    return { ...emptyResult("error", permissions, page), totals, error: "举报列表读取失败，请稍后再试。" };
  }

  const records = (data ?? []) as unknown as RawReport[];
  const profileMap = await fetchProfiles(
    supabase,
    records.flatMap((record) => [record.reporter_id, record.posts?.author_id]),
  );

  const keyword = sanitizeSearchTerm(params.q ?? "");
  const mapped = records.map((record) => mapReport(record, profileMap));
  const filtered = keyword ? mapped.filter((report) => matchesKeyword(report, keyword)) : mapped;
  const totalCount = filtered.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / ADMIN_REPORTS_PAGE_SIZE));
  const start = (Math.min(page, pageCount) - 1) * ADMIN_REPORTS_PAGE_SIZE;

  return {
    state: "ready",
    permissions,
    reports: filtered.slice(start, start + ADMIN_REPORTS_PAGE_SIZE),
    totals,
    page: Math.min(page, pageCount),
    pageSize: ADMIN_REPORTS_PAGE_SIZE,
    totalCount,
    pageCount,
  };
}

async function getReportTotals(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  const [total, open, resolved, rejected] = await Promise.all([
    supabase.from("post_reports").select("id", { count: "exact", head: true }),
    supabase.from("post_reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("post_reports").select("id", { count: "exact", head: true }).eq("status", "resolved"),
    supabase.from("post_reports").select("id", { count: "exact", head: true }).eq("status", "rejected"),
  ]);

  return {
    total: total.count ?? 0,
    open: open.count ?? 0,
    processed: (resolved.count ?? 0) + (rejected.count ?? 0),
  };
}

async function fetchProfiles(supabase: ReturnType<typeof createSupabaseAdminClient>, ids: Array<string | null | undefined>) {
  const uniqueIds = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (uniqueIds.length === 0) return new Map<string, ProfileSummary>();

  const { data } = await supabase.from("profiles").select("id,email,nickname").in("id", uniqueIds);
  return new Map(((data ?? []) as ProfileSummary[]).map((profile) => [profile.id, profile]));
}

function mapReport(record: RawReport, profileMap: Map<string, ProfileSummary>): AdminReportListItem {
  const post = record.posts;
  const postType = post?.post_type ?? "job";
  const postStatus = post?.status ?? "deleted";
  const reportCount = extractReportCount(post?.post_stats ?? null);

  return {
    id: record.id,
    postId: record.post_id,
    postType,
    postTypeLabel: POST_TYPE_LABELS[postType],
    postStatus,
    postStatusLabel: postStatusLabel(postStatus),
    postTitle: post?.title ?? "帖子已不存在",
    postHref: `${POST_TYPE_TO_ROUTE[postType]}/${record.post_id}`,
    authorId: post?.author_id ?? null,
    authorLabel: profileLabel(profileMap.get(post?.author_id ?? ""), post?.author_id),
    reporterId: record.reporter_id,
    reporterLabel: profileLabel(profileMap.get(record.reporter_id ?? ""), record.reporter_id),
    reason: record.reason,
    reasonLabel: REPORT_REASON_LABELS[record.reason] ?? record.reason,
    detail: record.detail,
    status: record.status,
    statusLabel: REPORT_STATUS_LABELS[record.status],
    reportCount,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function extractReportCount(value: RawReport["posts"] extends infer Post ? Post extends { post_stats?: infer Stats } ? Stats : never : never) {
  if (Array.isArray(value)) return Number(value[0]?.report_count ?? 0);
  return Number(value?.report_count ?? 0);
}

function profileLabel(profile?: ProfileSummary, fallbackId?: string | null) {
  if (profile?.email && profile.nickname) return `${profile.nickname} / ${profile.email}`;
  if (profile?.email) return profile.email;
  if (profile?.nickname) return profile.nickname;
  return fallbackId ?? "未知用户";
}

function matchesKeyword(report: AdminReportListItem, keyword: string) {
  const haystack = [report.postTitle, report.detail, report.authorLabel, report.reporterLabel, report.postId, report.reporterId, report.authorId]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(keyword.toLowerCase());
}

function emptyResult(state: QueryState, permissions: AdminReportsPermissions, page: number): AdminReportsData {
  return {
    state,
    permissions,
    reports: [],
    totals: { total: 0, open: 0, processed: 0 },
    page,
    pageSize: ADMIN_REPORTS_PAGE_SIZE,
    totalCount: 0,
    pageCount: 1,
  };
}

function normalizePage(value?: number) {
  if (!value || !Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

export function normalizeReportStatus(value?: ReportFilterStatus) {
  if (value === "dismissed") return "rejected";
  if (value === "open" || value === "in_review" || value === "resolved" || value === "rejected" || value === "all") return value;
  return undefined;
}

function sanitizeSearchTerm(value: string) {
  return value.trim().replace(/[%_,]/g, "").slice(0, 80);
}
