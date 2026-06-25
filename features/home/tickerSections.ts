export const homeTickerSections = [
  { sectionKey: "news", sectionName: "新闻", sortOrder: 10, displayCount: 5 },
  { sectionKey: "jobs", sectionName: "招聘", sortOrder: 20, displayCount: 3 },
  { sectionKey: "housing", sectionName: "房屋", sortOrder: 30, displayCount: 3 },
  { sectionKey: "marketplace", sectionName: "二手", sortOrder: 40, displayCount: 3 },
  { sectionKey: "services", sectionName: "本地服务", sortOrder: 50, displayCount: 3 },
] as const;

export type HomeTickerSectionKey = (typeof homeTickerSections)[number]["sectionKey"];

const canonicalTickerSectionKeys = new Set<string>(homeTickerSections.map((section) => section.sectionKey));

export function normalizeHomeTickerSectionKey(value?: string | null): HomeTickerSectionKey | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "job") return "jobs";
  if (normalized === "service") return "services";
  return canonicalTickerSectionKeys.has(normalized) ? (normalized as HomeTickerSectionKey) : null;
}

export function getHomeTickerSectionDefaults(sectionKey: HomeTickerSectionKey) {
  return homeTickerSections.find((section) => section.sectionKey === sectionKey) ?? homeTickerSections[0];
}
