export const NEWS_VIEW_SETTING_KEY = "news_view_display";
export type NewsViewSettings = { detail: boolean; list: boolean };
export function normalizeNewsViewSettings(value: unknown): NewsViewSettings {
  const record =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  return { detail: record.detail === true, list: record.list === true };
}
