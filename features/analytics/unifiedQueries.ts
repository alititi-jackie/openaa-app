import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ANALYTICS_SITES, type AnalyticsSite } from "./shared";

export type AnalyticsReport = {
  views: number;
  visitors: number;
  startDate: string;
  endDate: string;
  daily: { day: string; views: number; visitors: number }[];
  pages: {
    site: AnalyticsSite;
    path: string;
    title: string | null;
    views: number;
    visitors: number;
  }[];
  sites: { label: AnalyticsSite; views: number; visitors: number }[];
  dimensions: Record<string, { label: string; views: number }[]>;
};
export function analyticsFilters(site?: string, period?: string) {
  return {
    site:
      site && Object.hasOwn(ANALYTICS_SITES, site)
        ? (site as AnalyticsSite)
        : null,
    period:
      period && ["today", "yesterday", "7", "30"].includes(period)
        ? period
        : "7",
  };
}
export async function getUnifiedAnalytics(
  site: AnalyticsSite | null,
  period: string,
): Promise<{ data: AnalyticsReport | null; error: string | null }> {
  const db = await createSupabaseServerClient();
  if (!db) return { data: null, error: "数据库尚未配置。" };
  const { data, error } = await db.rpc("get_unified_analytics", {
    p_site: site,
    p_period: period,
  });
  if (error || !data || !Array.isArray(data.daily)) {
    return {
      data: null,
      error: "流量统计暂时无法读取，请检查数据库迁移 033 和管理员权限。",
    };
  }
  return { data: data as AnalyticsReport, error: null };
}
