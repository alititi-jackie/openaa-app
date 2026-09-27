import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { newYorkDayStart } from "./timeZone";

export type PopularPageItem = {
  path: string;
  title: string | null;
  views: number;
  visitors: number;
  lastViewedAt: string;
};

export type SiteAnalyticsSummary = {
  state: "ready" | "missing_config" | "error";
  error?: string;
  todayViews: number;
  todayVisitors: number;
  todayLogins: number;
  todayNewUsers: number;
  activeVisitors: number;
  totalUsers: number;
  sevenDayVisitors: number;
  popularPages: PopularPageItem[];
};

type AnalyticsRpcData = Pick<SiteAnalyticsSummary, "todayViews" | "todayVisitors" | "activeVisitors" | "sevenDayVisitors" | "popularPages">;

export async function getSiteAnalyticsSummary(): Promise<SiteAnalyticsSummary> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return emptySummary("missing_config", "Supabase 环境变量未配置，暂时无法读取访问统计。");

  const now = new Date();
  const todayStart = newYorkDayStart(now);
  const sevenDaysAgo = newYorkDayStart(now, 6);
  const activeSince = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

  const [
    analyticsResult,
    todayLoginsResult,
    todayNewUsersResult,
    totalUsersResult,
  ] = await Promise.all([
    supabase.rpc("get_site_analytics_summary", {
      p_today_start: todayStart,
      p_seven_day_start: sevenDaysAgo,
      p_active_since: activeSince,
    }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("last_login_at", todayStart),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const firstError =
    analyticsResult.error ??
    todayLoginsResult.error ??
    todayNewUsersResult.error ??
    totalUsersResult.error;

  if (firstError) {
    return emptySummary("error", "访问统计读取失败，请检查数据库连接与统计表权限。");
  }

  const analytics = analyticsResult.data as AnalyticsRpcData | null;
  if (!analytics || !Array.isArray(analytics.popularPages)) {
    return emptySummary("error", "访问统计读取失败，请检查统计函数是否已部署。");
  }

  return {
    state: "ready",
    todayViews: analytics.todayViews,
    todayVisitors: analytics.todayVisitors,
    activeVisitors: analytics.activeVisitors,
    sevenDayVisitors: analytics.sevenDayVisitors,
    todayLogins: todayLoginsResult.count ?? 0,
    todayNewUsers: todayNewUsersResult.count ?? 0,
    totalUsers: totalUsersResult.count ?? 0,
    popularPages: analytics.popularPages.map((page) => ({ ...page, title: normalizePageTitle(page.title) })),
  };
}

function emptySummary(state: SiteAnalyticsSummary["state"], error?: string): SiteAnalyticsSummary {
  return {
    state,
    error,
    todayViews: 0,
    todayVisitors: 0,
    todayLogins: 0,
    todayNewUsers: 0,
    activeVisitors: 0,
    totalUsers: 0,
    sevenDayVisitors: 0,
    popularPages: [],
  };
}

function normalizePageTitle(title: string | null) {
  return title?.replace(/\s*\|\s*OpenAA\s*$/i, "").trim() || null;
}
