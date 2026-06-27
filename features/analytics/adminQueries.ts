import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const POPULAR_PAGE_LIMIT = 10;
const MAX_ANALYTICS_ROWS = 8000;

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

type PageViewRow = {
  path: string;
  title: string | null;
  user_id: string | null;
  visitor_id: string | null;
  created_at: string;
};

export async function getSiteAnalyticsSummary(): Promise<SiteAnalyticsSummary> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return emptySummary("missing_config", "Supabase 环境变量未配置，暂时无法读取访问统计。");

  const now = new Date();
  const todayStart = startOfDay(now).toISOString();
  const sevenDaysAgo = daysAgo(now, 7).toISOString();
  const activeSince = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

  const [
    todayViewsResult,
    todayVisitorsRows,
    activeVisitorRows,
    sevenDayVisitorRows,
    popularPageRows,
    todayLoginsResult,
    todayNewUsersResult,
    totalUsersResult,
  ] = await Promise.all([
    supabase.from("site_page_views").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
    supabase.from("site_page_views").select("user_id,visitor_id").gte("created_at", todayStart).limit(MAX_ANALYTICS_ROWS),
    supabase.from("site_page_views").select("user_id,visitor_id").gte("created_at", activeSince).limit(MAX_ANALYTICS_ROWS),
    supabase.from("site_page_views").select("user_id,visitor_id").gte("created_at", sevenDaysAgo).limit(MAX_ANALYTICS_ROWS),
    supabase
      .from("site_page_views")
      .select("path,title,user_id,visitor_id,created_at")
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(MAX_ANALYTICS_ROWS),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("last_login_at", todayStart),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const firstError =
    todayViewsResult.error ??
    todayVisitorsRows.error ??
    activeVisitorRows.error ??
    sevenDayVisitorRows.error ??
    popularPageRows.error ??
    todayLoginsResult.error ??
    todayNewUsersResult.error ??
    totalUsersResult.error;

  if (firstError) {
    return emptySummary("error", "访问统计读取失败，请确认数据库 migration 已执行。");
  }

  return {
    state: "ready",
    todayViews: todayViewsResult.count ?? 0,
    todayVisitors: countDistinctActors(todayVisitorsRows.data ?? []),
    activeVisitors: countDistinctActors(activeVisitorRows.data ?? []),
    sevenDayVisitors: countDistinctActors(sevenDayVisitorRows.data ?? []),
    todayLogins: todayLoginsResult.count ?? 0,
    todayNewUsers: todayNewUsersResult.count ?? 0,
    totalUsers: totalUsersResult.count ?? 0,
    popularPages: buildPopularPages((popularPageRows.data ?? []) as PageViewRow[]),
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

function countDistinctActors(rows: Array<{ user_id: string | null; visitor_id: string | null }>) {
  const actors = new Set<string>();
  for (const row of rows) {
    const actor = row.user_id ? `u:${row.user_id}` : row.visitor_id ? `v:${row.visitor_id}` : null;
    if (actor) actors.add(actor);
  }
  return actors.size;
}

function buildPopularPages(rows: PageViewRow[]): PopularPageItem[] {
  const map = new Map<string, { title: string | null; views: number; actors: Set<string>; lastViewedAt: string }>();

  for (const row of rows) {
    if (shouldHideAnalyticsPath(row.path)) continue;
    const current = map.get(row.path) ?? {
      title: row.title,
      views: 0,
      actors: new Set<string>(),
      lastViewedAt: row.created_at,
    };
    current.views += 1;
    current.title = current.title ?? row.title;
    if (new Date(row.created_at).getTime() > new Date(current.lastViewedAt).getTime()) {
      current.lastViewedAt = row.created_at;
    }
    const actor = row.user_id ? `u:${row.user_id}` : row.visitor_id ? `v:${row.visitor_id}` : null;
    if (actor) current.actors.add(actor);
    map.set(row.path, current);
  }

  return Array.from(map.entries())
    .map(([path, item]) => ({
      path,
      title: normalizePageTitle(item.title),
      views: item.views,
      visitors: item.actors.size,
      lastViewedAt: item.lastViewedAt,
    }))
    .sort((a, b) => b.views - a.views || b.visitors - a.visitors)
    .slice(0, POPULAR_PAGE_LIMIT);
}

function normalizePageTitle(title: string | null) {
  return title?.replace(/\s*\|\s*OpenAA\s*$/i, "").trim() || null;
}

function shouldHideAnalyticsPath(path: string) {
  return path.startsWith("/admin") || path.startsWith("/api") || path.startsWith("/_next");
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function daysAgo(date: Date, days: number) {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
}
