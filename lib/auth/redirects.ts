import { redirect } from "next/navigation";
import { siteConfig } from "@/lib/seo/siteConfig";

const defaultReturnTo = "/profile";
const blockedReturnToPaths = new Set(["/login", "/register", "/forgot-password", "/auth/callback", "/auth-required"]);

type SafeReturnToOptions = {
  fallback?: string;
  allowResetPassword?: boolean;
};

function normalizeSafeReturnToOptions(optionsOrFallback?: string | SafeReturnToOptions): Required<SafeReturnToOptions> {
  if (typeof optionsOrFallback === "string") {
    return { fallback: optionsOrFallback, allowResetPassword: false };
  }

  return {
    fallback: optionsOrFallback?.fallback ?? defaultReturnTo,
    allowResetPassword: optionsOrFallback?.allowResetPassword ?? false,
  };
}

export function safeReturnTo(value: string | null | undefined, optionsOrFallback?: string | SafeReturnToOptions) {
  const { fallback, allowResetPassword } = normalizeSafeReturnToOptions(optionsOrFallback);

  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;

  try {
    const parsed = new URL(value, siteConfig.canonicalBaseUrl);
    if (parsed.origin !== siteConfig.canonicalBaseUrl) return fallback;
    if (!parsed.pathname.startsWith("/")) return fallback;
    if (blockedReturnToPaths.has(parsed.pathname) || (!allowResetPassword && parsed.pathname === "/reset-password")) {
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
