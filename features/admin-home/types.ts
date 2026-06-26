export type AdminHomeActionState = {
  ok: boolean;
  message: string;
  id?: string;
  normalizedUrl?: string;
};

export type AdminHomeSectionRow = {
  key: string;
  title: string;
  description: string | null;
  module: string;
  config: Record<string, unknown>;
  is_visible: boolean;
  sort_order: number;
};

export type AdminTopQuickLinkRow = {
  id: string;
  key: string;
  title: string;
  href: string;
  open_mode: "same" | "new";
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  city_id: string | null;
};

export type AdminTickerRow = {
  id: string;
  title: string;
  href: string | null;
  module: string | null;
  is_enabled: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
};

export type AdminTickerGlobalSettingsRow = {
  is_enabled: boolean;
  interval_seconds: number;
};

export type AdminTickerSectionSettingsRow = {
  section_key: string;
  section_name: string;
  is_enabled: boolean;
  sort_order: number;
  display_count: number;
};

export type AdminHomePermissions = {
  manageHomeSections: boolean;
  manageTopLinks: boolean;
  manageLatestTicker: boolean;
  manageAds: boolean;
};
