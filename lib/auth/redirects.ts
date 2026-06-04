import { redirect } from "next/navigation";

export function safeReturnTo(value: string | null | undefined, fallback = "/profile") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function redirectToAuthRequired(returnTo: string): never {
  redirect(`/auth-required?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`);
}
