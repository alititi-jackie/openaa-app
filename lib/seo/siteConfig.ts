const fallbackSiteUrl = "https://openaa.app";
const fallbackPrimarySeoUrl = fallbackSiteUrl;

function normalizeBaseUrl(value: string | undefined, fallback: string) {
  const raw = value?.trim() || fallback;
  const withProtocol = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, "");
}

function hostnameFromUrl(value: string) {
  try {
    return new URL(value).hostname;
  } catch {
    return value.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  }
}

export const siteConfig = {
  name: "OpenAA",
  title: "OpenAA 纽约华人生活信息平台",
  description:
    "OpenAA 是面向纽约华人的移动优先生活信息平台，提供招聘、房屋、二手市场、本地服务、新闻、DMV 练习和导航入口。",
  appBaseUrl: normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL, fallbackSiteUrl),
  primarySeoBaseUrl: normalizeBaseUrl(process.env.NEXT_PUBLIC_PRIMARY_SEO_URL, fallbackPrimarySeoUrl),
  canonicalBaseUrl: normalizeBaseUrl(
    process.env.NEXT_PUBLIC_CANONICAL_URL,
    process.env.NEXT_PUBLIC_PRIMARY_SEO_URL || process.env.NEXT_PUBLIC_SITE_URL || fallbackSiteUrl,
  ),
  allowedDomains: ["openaa.app", "openaa.com", "openaa.cn"],
  redirectDomains: ["openaa.cn"],
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

export const noindexRoutePrefixes = [
  "/admin",
  "/api",
  "/feedback",
  "/login",
  "/register",
  "/forgot-password",
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
  "/marketplace/publish",
  "/marketplace/edit",
  "/services/publish",
  "/services/edit",
  "/notifications",
  "/drafts",
];

export const staticSitemapRoutes = [
  "/",
  "/jobs",
  "/housing",
  "/marketplace",
  "/services",
  "/news",
  "/dmv",
  "/navigation",
  "/privacy",
  "/terms",
  "/community-guidelines",
  "/contact",
];
