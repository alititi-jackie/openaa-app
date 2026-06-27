import { NextResponse } from "next/server";
import { safeReturnTo } from "@/lib/auth/redirects";
import { ensureProfileForUser } from "@/lib/supabase/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const loginErrorMessage = "登录失败，请重新尝试。";
const recoveryReturnTo = "/reset-password";

function redirectUrl(requestUrl: URL, path: string, params?: Record<string, string>) {
  const url = new URL(path, requestUrl.origin);

  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, value);
  }

  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const callbackType = requestUrl.searchParams.get("type");
  const callbackError = requestUrl.searchParams.get("error");
  const callbackErrorCode = requestUrl.searchParams.get("error_code");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const requestedReturnTo = requestUrl.searchParams.get("returnTo");
  const isRecoveryCallback = callbackType === "recovery" || requestedReturnTo?.startsWith(recoveryReturnTo) === true;
  const returnTo = safeReturnTo(requestedReturnTo, { allowResetPassword: isRecoveryCallback });
  const recoveryRedirectTo = returnTo.startsWith(recoveryReturnTo) ? returnTo : recoveryReturnTo;
  const loginErrorParams = { error: loginErrorMessage, source: "oauth" };

  if (errorDescription) {
    console.error("[auth/callback] provider returned error", {
      error: callbackError,
      errorCode: callbackErrorCode,
      errorDescription,
      callbackType,
      returnTo,
    });
    return redirectUrl(requestUrl, isRecoveryCallback ? recoveryRedirectTo : "/login", isRecoveryCallback ? undefined : loginErrorParams);
  }

  if (!code) {
    console.error("[auth/callback] missing code", {
      error: callbackError,
      errorCode: callbackErrorCode,
      callbackType,
      returnTo,
    });
    return redirectUrl(requestUrl, isRecoveryCallback ? recoveryRedirectTo : "/login", isRecoveryCallback ? undefined : loginErrorParams);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return redirectUrl(requestUrl, "/login", { error: "登录服务暂时不可用，请稍后再试。" });
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("[auth/callback] exchangeCodeForSession failed", exchangeError);
    return redirectUrl(requestUrl, isRecoveryCallback ? recoveryRedirectTo : "/login", isRecoveryCallback ? undefined : loginErrorParams);
  }

  if (isRecoveryCallback) {
    return redirectUrl(requestUrl, recoveryRedirectTo);
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

  return redirectUrl(requestUrl, returnTo);
}
