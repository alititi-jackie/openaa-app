import "server-only";

import { hasAdminPermission } from "@/lib/permissions/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const DAILY_POST_LIMIT_KEY = "daily_post_limit";
export const DEFAULT_DAILY_POST_LIMIT = 5;

export type AdminSiteSetting = {
  key: string;
  value: unknown;
  description: string | null;
  isPublic: boolean;
  updatedAt: string | null;
};

export type AdminSettingsData = {
  state: "ready" | "missing_config" | "error";
  error?: string;
  canManageSettings: boolean;
  dailyPostLimit: number;
  settings: AdminSiteSetting[];
};

type RawSiteSetting = {
  key: string;
  value: unknown;
  description: string | null;
  is_public: boolean;
  updated_at: string | null;
};

export async function getAdminSettingsData(): Promise<AdminSettingsData> {
  const supabase = await createSupabaseServerClient();
  const canManageSettings = await hasAdminPermission("manage_settings");

  if (!supabase) {
    return {
      state: "missing_config",
      canManageSettings,
      dailyPostLimit: DEFAULT_DAILY_POST_LIMIT,
      settings: [],
      error: "Supabase 环境变量未配置，暂时无法读取站点设置。",
    };
  }

  if (!canManageSettings) {
    return {
      state: "ready",
      canManageSettings,
      dailyPostLimit: DEFAULT_DAILY_POST_LIMIT,
      settings: [],
    };
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("key,value,description,is_public,updated_at")
    .order("key", { ascending: true });

  if (error) {
    return {
      state: "error",
      canManageSettings,
      dailyPostLimit: DEFAULT_DAILY_POST_LIMIT,
      settings: [],
      error: "站点设置读取失败，请稍后再试。",
    };
  }

  const rows = ((data ?? []) as RawSiteSetting[]).map(mapSiteSetting);
  const dailyLimit = rows.find((setting) => setting.key === DAILY_POST_LIMIT_KEY);

  return {
    state: "ready",
    canManageSettings,
    dailyPostLimit: normalizeDailyPostLimit(dailyLimit?.value),
    settings: rows,
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

function mapSiteSetting(row: RawSiteSetting): AdminSiteSetting {
  return {
    key: row.key,
    value: row.value,
    description: row.description,
    isPublic: Boolean(row.is_public),
    updatedAt: row.updated_at,
  };
}
