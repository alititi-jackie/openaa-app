import { NextResponse } from "next/server";
import { ensureProfileForUser } from "@/lib/supabase/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const fallbackReturnTo = "/profile";
const allowedReturnToPrefixes = [
  "/profile",
  "/reset-password",
  "/jobs",
  "/housing",
  "/secondhand",
  "/services",
  "/navigation/my",
  "/dmv",
  "/admin",
];
const recoveryErrorMessage = "重置链接已失效，请重新发送重置邮件。";
const loginErrorMessage = "登录失败，请重新尝试。";
const loginSuccessMessage = "登录成功";

function redirectUrl(requestUrl: URL, path: string, params?: Record<string, string>) {
  const url = new URL(path, requestUrl.origin);

  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, value);
  }

  return NextResponse.redirect(url);
}

function safeReturnTo(value: string | null, requestOrigin: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallbackReturnTo;
  }

  try {
    const parsed = new URL(value, requestOrigin);

    if (parsed.origin !== requestOrigin) {
      return fallbackReturnTo;
    }

    const pathname = parsed.pathname;
    const pathWithSearch = `${pathname}${parsed.search}${parsed.hash}`;
    const isAllowed = allowedReturnToPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

    return isAllowed ? pathWithSearch : fallbackReturnTo;
  } catch {
    return fallbackReturnTo;
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const callbackType = requestUrl.searchParams.get("type");
  const callbackError = requestUrl.searchParams.get("error");
  const callbackErrorCode = requestUrl.searchParams.get("error_code");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const returnTo = safeReturnTo(requestUrl.searchParams.get("returnTo"), requestUrl.origin);
  const isRecoveryCallback = callbackType === "recovery" || returnTo.startsWith("/reset-password");
  const recoveryErrorParams = { error: recoveryErrorMessage, source: "recovery", type: "recovery" };
  const loginErrorParams = { error: loginErrorMessage, source: "oauth" };

  if (errorDescription) {
    console.error("[auth/callback] provider returned error", {
      error: callbackError,
      errorCode: callbackErrorCode,
      errorDescription,
      callbackType,
      returnTo,
    });
    return redirectUrl(requestUrl, "/login", isRecoveryCallback ? recoveryErrorParams : loginErrorParams);
  }

  if (!code) {
    console.error("[auth/callback] missing code", {
      error: callbackError,
      errorCode: callbackErrorCode,
      callbackType,
      returnTo,
    });
    return redirectUrl(requestUrl, "/login", isRecoveryCallback ? recoveryErrorParams : loginErrorParams);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return redirectUrl(requestUrl, "/login", { error: "登录服务暂时不可用，请稍后再试。" });
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("[auth/callback] exchangeCodeForSession failed", exchangeError);
    return redirectUrl(requestUrl, "/login", isRecoveryCallback ? recoveryErrorParams : loginErrorParams);
  }

  if (isRecoveryCallback) {
    return redirectUrl(requestUrl, returnTo);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("[auth/callback] getUser failed", userError);
    return redirectUrl(requestUrl, "/login", loginErrorParams);
  }

  try {
    await ensureProfileForUser(user);
  } catch (profileError) {
    console.error("[auth/callback] ensureProfileForUser failed", profileError);
  }

  return redirectUrl(requestUrl, "/login", {
    source: "login",
    message: loginSuccessMessage,
    autoRedirect: "1",
    returnTo,
  });
}
