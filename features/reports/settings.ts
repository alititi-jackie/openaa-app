import "server-only";

export const REPORT_LIMIT_SETTING_KEYS = {
  userDailyLimit: "report_daily_user_limit",
  visitorDailyLimit: "report_daily_visitor_limit",
  ipDailyLimit: "report_daily_ip_limit",
  totalDailyLimit: "report_daily_total_limit",
} as const;

export type ReportLimitSettings = {
  userDailyLimit: number;
  visitorDailyLimit: number;
  ipDailyLimit: number;
  totalDailyLimit: number;
};

export const DEFAULT_REPORT_LIMIT_SETTINGS: ReportLimitSettings = {
  userDailyLimit: 20,
  visitorDailyLimit: 5,
  ipDailyLimit: 50,
  totalDailyLimit: 200,
};

export const REPORT_LIMIT_RANGE = {
  min: 1,
  max: 1000,
};

export async function readReportLimitSettings(supabase: { from: (table: "site_settings") => unknown }): Promise<ReportLimitSettings> {
  const keys = Object.values(REPORT_LIMIT_SETTING_KEYS);
  const query = supabase.from("site_settings") as {
    select: (columns: string) => {
      in: (column: string, values: string[]) => PromiseLike<{ data: Array<{ key: string; value: unknown }> | null; error: unknown }>;
    };
  };
  const { data, error } = await query.select("key,value").in("key", keys);
  if (error) return DEFAULT_REPORT_LIMIT_SETTINGS;

  const values = new Map((data ?? []).map((row) => [row.key, row.value]));
  return {
    userDailyLimit: normalizeReportLimit(values.get(REPORT_LIMIT_SETTING_KEYS.userDailyLimit), DEFAULT_REPORT_LIMIT_SETTINGS.userDailyLimit),
    visitorDailyLimit: normalizeReportLimit(values.get(REPORT_LIMIT_SETTING_KEYS.visitorDailyLimit), DEFAULT_REPORT_LIMIT_SETTINGS.visitorDailyLimit),
    ipDailyLimit: normalizeReportLimit(values.get(REPORT_LIMIT_SETTING_KEYS.ipDailyLimit), DEFAULT_REPORT_LIMIT_SETTINGS.ipDailyLimit),
    totalDailyLimit: normalizeReportLimit(values.get(REPORT_LIMIT_SETTING_KEYS.totalDailyLimit), DEFAULT_REPORT_LIMIT_SETTINGS.totalDailyLimit),
  };
}

export function normalizeReportLimit(value: unknown, fallback: number): number {
  let candidate: unknown = value;

  if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
    const record = candidate as Record<string, unknown>;
    candidate = record.limit ?? record.value ?? record.count ?? record.dailyLimit;
  }

  const parsed = typeof candidate === "number" ? candidate : typeof candidate === "string" ? Number(candidate) : Number.NaN;
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return fallback;
  if (parsed < REPORT_LIMIT_RANGE.min || parsed > REPORT_LIMIT_RANGE.max) return fallback;
  return parsed;
}
