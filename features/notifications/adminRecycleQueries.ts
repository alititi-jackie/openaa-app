import "server-only";

import { hasAdminModule, isSuperAdmin } from "@/lib/permissions/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type DeletedNotificationsRecycleData = {
  state: "ready" | "missing_config" | "forbidden" | "error";
  error?: string;
  superAdmin: boolean;
  deletedCount: number;
  olderThan30Count: number;
  olderThan90Count: number;
  recentItems: Array<{
    id: string;
    title: string;
    userId: string;
    deletedAt: string | null;
    createdAt: string;
  }>;
};

export async function getDeletedNotificationsRecycleData(): Promise<DeletedNotificationsRecycleData> {
  const superAdmin = await isSuperAdmin();
  if (!(await hasAdminModule("recycle-bin"))) {
    return emptyResult("forbidden", superAdmin);
  }

  let supabase: ReturnType<typeof createSupabaseAdminClient>;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return emptyResult("missing_config", superAdmin, "Supabase service role 环境变量未配置。");
  }

  const now = Date.now();
  const olderThan30 = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const olderThan90 = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString();

  const [deleted, old30, old90, recent] = await Promise.all([
    supabase.from("notifications").select("id", { count: "exact", head: true }).not("deleted_at", "is", null),
    supabase.from("notifications").select("id", { count: "exact", head: true }).not("deleted_at", "is", null).lt("deleted_at", olderThan30),
    supabase.from("notifications").select("id", { count: "exact", head: true }).not("deleted_at", "is", null).lt("deleted_at", olderThan90),
    supabase
      .from("notifications")
      .select("id,title,user_id,deleted_at,created_at")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false, nullsFirst: false })
      .limit(20),
  ]);

  const error = deleted.error ?? old30.error ?? old90.error ?? recent.error;
  if (error) return emptyResult("error", superAdmin, "已删除通知读取失败，请稍后再试。");

  return {
    state: "ready",
    superAdmin,
    deletedCount: deleted.count ?? 0,
    olderThan30Count: old30.count ?? 0,
    olderThan90Count: old90.count ?? 0,
    recentItems: ((recent.data ?? []) as Array<{ id: string; title: string | null; user_id: string | null; deleted_at: string | null; created_at: string }>).map((row) => ({
      id: row.id,
      title: row.title || "未命名通知",
      userId: row.user_id || "未记录",
      deletedAt: row.deleted_at,
      createdAt: row.created_at,
    })),
  };
}

function emptyResult(state: DeletedNotificationsRecycleData["state"], superAdmin: boolean, error?: string): DeletedNotificationsRecycleData {
  return {
    state,
    error,
    superAdmin,
    deletedCount: 0,
    olderThan30Count: 0,
    olderThan90Count: 0,
    recentItems: [],
  };
}
