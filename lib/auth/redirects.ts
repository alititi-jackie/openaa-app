import { redirect } from "next/navigation";
import { siteConfig } from "@/lib/seo/siteConfig";

export function safeReturnTo(value: string | null | undefined, fallback = "/profile") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;

  try {
    const parsed = new URL(value, siteConfig.canonicalBaseUrl);
    if (parsed.origin !== siteConfig.canonicalBaseUrl) return fallback;
    if (!parsed.pathname.startsWith("/")) return fallback;
    if (["/login", "/register", "/forgot-password", "/reset-password", "/auth/callback", "/auth-required"].includes(parsed.pathname)) {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function redirectToAuthRequired(returnTo: string): never {
  redirect(`/auth-required?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`);
}
