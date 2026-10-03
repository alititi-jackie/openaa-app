export const ANALYTICS_SITES = {
  openaa: { name: "OpenAA", origin: "https://openaa.com" },
  dmv: { name: "DMV", origin: "https://dmv.openaa.com" },
  tools: { name: "Tools", origin: "https://tools.openaa.com" },
  go: { name: "Go", origin: "https://go.openaa.com" },
} as const;
export type AnalyticsSite = keyof typeof ANALYTICS_SITES;

export function siteFromOrigin(origin: string | null): AnalyticsSite | null {
  return (
    (Object.keys(ANALYTICS_SITES) as AnalyticsSite[]).find(
      (key) => ANALYTICS_SITES[key].origin === origin,
    ) ?? null
  );
}
export function normalizeAnalyticsPath(value: unknown) {
  if (
    typeof value !== "string" ||
    value.length > 1000 ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  )
    return null;
  try {
    const path = new URL(value, "https://openaa.com").pathname.replace(
      /\/{2,}/g,
      "/",
    );
    if (
      /^\/(admin|api|_next|static)(\/|$)/i.test(path) ||
      /\.(ico|xml|txt|webmanifest|js|css|png|jpg|svg)$/i.test(path)
    )
      return null;
    return path;
  } catch {
    return null;
  }
}
export function referrerHost(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) ? url.hostname.slice(0, 253) : null;
  } catch {
    return null;
  }
}
export function agentDimensions(ua: string) {
  return {
    device_type: /ipad|tablet|android(?!.*mobile)/i.test(ua)
      ? "tablet"
      : /mobile|iphone|android/i.test(ua)
        ? "mobile"
        : "desktop",
    browser: /edg\//i.test(ua)
      ? "Edge"
      : /firefox|fxios/i.test(ua)
        ? "Firefox"
        : /chrome|crios/i.test(ua)
          ? "Chrome"
          : /safari/i.test(ua)
            ? "Safari"
            : "Other",
    operating_system: /iphone|ipad/i.test(ua)
      ? "iOS"
      : /android/i.test(ua)
        ? "Android"
        : /windows/i.test(ua)
          ? "Windows"
          : /macintosh|mac os/i.test(ua)
            ? "macOS"
            : /linux/i.test(ua)
              ? "Linux"
              : "Other",
  };
}
export function normalizeId(value: unknown) {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{16,120}$/.test(value)
    ? value
    : null;
}
