export const POST_VIEW_SETTING_KEY = "post_view_display";
export type PostViewSettings = { detail: boolean; list: boolean };

export function normalizePostViewSettings(value: unknown): PostViewSettings {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  // Preserve the existing display by default; malformed fields cannot enable it.
  return {
    detail: record.detail === undefined ? true : record.detail === true,
    list: record.list === undefined ? true : record.list === true,
  };
}
