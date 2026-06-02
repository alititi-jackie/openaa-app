import "server-only";

import { hasAdminPermission } from "@/lib/permissions/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

export type AuditLogFilter = {
  action?: string;
  entityType?: string;
  q?: string;
  page?: number;
};

export type AdminAuditLogItem = {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  beforeData: unknown;
  afterData: unknown;
  hasIpHash: boolean;
  hasUserAgent: boolean;
  createdAt: string;
};

export type AdminAuditLogsData = {
  state: "ready" | "missing_config" | "error";
  error?: string;
  canViewAuditLogs: boolean;
  logs: AdminAuditLogItem[];
  totals: {
    total: number;
    currentPage: number;
    actionCount: number;
    entityTypeCount: number;
  };
  actionOptions: string[];
  entityTypeOptions: string[];
  page: number;
  pageSize: number;
  pageCount: number;
  totalCount: number;
};

type RawAuditLog = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_data: unknown;
  after_data: unknown;
  ip_hash: string | null;
  user_agent: string | null;
  created_at: string;
};

export async function getAdminAuditLogsData(filters: AuditLogFilter = {}): Promise<AdminAuditLogsData> {
  const supabase = await createSupabaseServerClient();
  const canViewAuditLogs = await canViewAuditLogsPermission();
  const page = Math.max(1, filters.page ?? 1);

  if (!canViewAuditLogs) return emptyResult("ready", false, page);
  if (!supabase) return emptyResult("missing_config", canViewAuditLogs, page, "Supabase 环境变量未配置，暂时无法读取审计日志。");

  let query = supabase
    .from("admin_audit_logs")
    .select("id,actor_id,action,entity_type,entity_id,before_data,after_data,ip_hash,user_agent,created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  const action = filters.action?.trim();
  const entityType = filters.entityType?.trim();
  const search = filters.q?.trim();

  if (action && action !== "all") query = query.eq("action", action);
  if (entityType && entityType !== "all") query = query.eq("entity_type", entityType);
  if (search) {
    const escaped = escapeLike(search);
    query = query.or(`action.ilike.%${escaped}%,entity_type.ilike.%${escaped}%,entity_id.ilike.%${escaped}%,actor_id.eq.${escaped}`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, error, count } = await query.range(from, to);
  if (error) return emptyResult("error", canViewAuditLogs, page, "审计日志读取失败，请稍后再试。");

  const [total, actionOptions, entityTypeOptions] = await Promise.all([
    getTotalCount(supabase),
    getDistinctOptions(supabase, "action"),
    getDistinctOptions(supabase, "entity_type"),
  ]);
  const totalCount = count ?? 0;

  return {
    state: "ready",
    canViewAuditLogs,
    logs: ((data ?? []) as RawAuditLog[]).map(mapAuditLog),
    totals: {
      total,
      currentPage: data?.length ?? 0,
      actionCount: actionOptions.length,
      entityTypeCount: entityTypeOptions.length,
    },
    actionOptions,
    entityTypeOptions,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    totalCount,
  };
}

export async function canViewAuditLogsPermission() {
  const [adminAuditLogs, auditLogs] = await Promise.all([
    hasAdminPermission("view_admin_audit_logs"),
    hasAdminPermission("view_audit_logs"),
  ]);
  return adminAuditLogs || auditLogs;
}

function mapAuditLog(row: RawAuditLog): AdminAuditLogItem {
  return {
    id: row.id,
    actorId: row.actor_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    beforeData: row.before_data,
    afterData: row.after_data,
    hasIpHash: Boolean(row.ip_hash),
    hasUserAgent: Boolean(row.user_agent),
    createdAt: row.created_at,
  };
}

async function getTotalCount(supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>) {
  const { count } = await supabase.from("admin_audit_logs").select("id", { count: "exact", head: true });
  return count ?? 0;
}

async function getDistinctOptions(supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>, column: "action" | "entity_type") {
  if (column === "action") {
    const { data, error } = await supabase.from("admin_audit_logs").select("action").order("action", { ascending: true }).limit(500);
    if (error || !data) return [];
    return Array.from(new Set(data.map((row) => String(row.action)).filter(Boolean))).sort();
  }

  const { data, error } = await supabase.from("admin_audit_logs").select("entity_type").order("entity_type", { ascending: true }).limit(500);
  if (error || !data) return [];
  return Array.from(new Set(data.map((row) => String(row.entity_type)).filter(Boolean))).sort();
}

function emptyResult(
  state: AdminAuditLogsData["state"],
  canViewAuditLogs: boolean,
  page: number,
  error?: string,
): AdminAuditLogsData {
  return {
    state,
    error,
    canViewAuditLogs,
    logs: [],
    totals: { total: 0, currentPage: 0, actionCount: 0, entityTypeCount: 0 },
    actionOptions: [],
    entityTypeOptions: [],
    page,
    pageSize: PAGE_SIZE,
    pageCount: 1,
    totalCount: 0,
  };
}

function escapeLike(value: string) {
  return value.replaceAll("%", "\\%").replaceAll("_", "\\_");
}
