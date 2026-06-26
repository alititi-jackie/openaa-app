import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const DAILY_POST_LIMIT_KEY = "daily_post_limit";
export const DEFAULT_DAILY_POST_LIMIT = 5;

export type DailyPostLimitData = {
  state: "ready" | "missing_config" | "error";
  error?: string;
  dailyPostLimit: number;
};

export async function getDailyPostLimitData(): Promise<DailyPostLimitData> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      state: "missing_config",
      dailyPostLimit: DEFAULT_DAILY_POST_LIMIT,
      error: "Supabase 环境变量未配置，暂时无法读取每日发布上限。",
    };
  }

  const { data, error } = await supabase.from("site_settings").select("value").eq("key", DAILY_POST_LIMIT_KEY).maybeSingle();
  if (error) {
    return {
      state: "error",
      dailyPostLimit: DEFAULT_DAILY_POST_LIMIT,
      error: "每日发布上限读取失败，请稍后再试。",
    };
  }

  return {
    state: "ready",
    dailyPostLimit: normalizeDailyPostLimit((data as { value?: unknown } | null)?.value),
  };
}

export function normalizeDailyPostLimit(value: unknown): number {
  let candidate: unknown = value;

  if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
    const record = candidate as Record<string, unknown>;
    candidate = record.dailyPostLimit ?? record.daily_post_limit ?? record.limit ?? record.value;
  }

  const parsed = typeof candidate === "number" ? candidate : typeof candidate === "string" ? Number(candidate) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_DAILY_POST_LIMIT;
  return Math.min(100, Math.max(1, Math.floor(parsed)));
}
