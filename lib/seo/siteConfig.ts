const fallbackSiteUrl = "https://openaa.com";
const fallbackPrimarySeoUrl = fallbackSiteUrl;
const primarySiteHostname = "openaa.com";
const alternateMainSiteHostnames = new Set([
  "www.openaa.com",
  "app.openaa.com",
  "ny.openaa.com",
  "openaa.app",
  "www.openaa.app",
]);

function normalizeBaseUrl(value: string | undefined, fallback: string) {
  const raw = value?.trim() || fallback;
  const withProtocol = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  const normalized = withProtocol.replace(/\/+$/, "");

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString().replace(/\/+$/, "");
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function hostnameFromUrl(value: string) {
  try {
    return new URL(value).hostname;
  } catch {
    return value.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  }
}

function normalizePrimarySiteUrl(value: string | undefined, fallback: string) {
  const normalized = normalizeBaseUrl(value, fallback);
  return hostnameFromUrl(normalized) === primarySiteHostname ? normalized : fallback;
}

export const siteConfig = {
  name: "OpenAA",
  title: "OpenAA 纽约华人生活信息平台",
  description:
    "OpenAA 是面向纽约华人的移动优先生活信息平台，提供招聘、房屋、二手市场、本地服务、新闻、DMV 练习和导航入口。",
  appBaseUrl: normalizePrimarySiteUrl(process.env.NEXT_PUBLIC_SITE_URL, fallbackSiteUrl),
  primarySeoBaseUrl: normalizePrimarySiteUrl(process.env.NEXT_PUBLIC_PRIMARY_SEO_URL, fallbackPrimarySeoUrl),
  canonicalBaseUrl: normalizePrimarySiteUrl(
    process.env.NEXT_PUBLIC_CANONICAL_URL,
    fallbackSiteUrl,
  ),
  allowedDomains: ["openaa.com"],
  redirectDomains: [],
  locale: "zh_CN",
  defaultCity: {
    id: "ny",
    name: "纽约",
    state: "NY",
  },
};

export const appDomain = hostnameFromUrl(siteConfig.appBaseUrl);
export const primarySeoDomain = hostnameFromUrl(siteConfig.primarySeoBaseUrl);
export const canonicalDomain = hostnameFromUrl(siteConfig.canonicalBaseUrl);

export function canonicalUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, siteConfig.canonicalBaseUrl).toString();
}

export function appUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, siteConfig.appBaseUrl).toString();
}

export function canonicalizeMainSiteHref(value: string) {
  const raw = value.trim();
  if (!raw || raw.startsWith("/") || raw.startsWith("#")) return raw;

  try {
    const url = new URL(raw);
    const hostname = url.hostname.toLowerCase();

    if (hostname === primarySiteHostname || alternateMainSiteHostnames.has(hostname)) {
      return `${url.pathname}${url.search}${url.hash}` || "/";
    }
  } catch {
    return raw;
  }

  return raw;
}

export const noindexRoutePrefixes = [
  "/admin",
  "/api",
  "/feedback",
  "/report",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/profile",
  "/navigation/my",
  "/search",
  "/dmv/wrong-questions",
  "/publish",
  "/edit",
  "/jobs/publish",
  "/jobs/edit",
  "/housing/publish",
  "/housing/edit",
  "/secondhand/publish",
  "/secondhand/edit",
  "/services/publish",
  "/services/edit",
  "/notifications",
  "/drafts",
];

export const staticSitemapRoutes = [
  "/",
  "/jobs",
  "/housing",
  "/secondhand",
  "/services",
  "/news",
  "/dmv",
  "/navigation",
  "/about",
  "/privacy",
  "/terms",
  "/community-guidelines",
  "/contact",
  "/app",
];
