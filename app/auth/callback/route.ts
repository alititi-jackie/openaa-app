import { NextResponse } from "next/server";
import { emailConfirmationSuccessMessage } from "@/lib/auth/confirmationEmail";
import { safeReturnTo } from "@/lib/auth/redirects";
import { ensureProfileForUser } from "@/lib/supabase/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const loginErrorMessage = "登录失败，请重新尝试。";
const recoveryErrorMessage = "重置链接已失效，请重新发送重置邮件。";
const recoveryReturnTo = "/reset-password";
const signupConfirmationSuccessParams = {
  message: emailConfirmationSuccessMessage,
  source: "signup",
  type: "signup",
};

function redirectUrl(requestUrl: URL, path: string, params?: Record<string, string>) {
  const url = new URL(path, requestUrl.origin);

  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, value);
  }

  return NextResponse.redirect(url);
}

function recoveryHashBridgeResponse(requestUrl: URL, path: string) {
  const targetUrl = new URL(path, requestUrl.origin);
  const fallbackUrl = new URL(path, requestUrl.origin);
  fallbackUrl.searchParams.set("error", recoveryErrorMessage);
  fallbackUrl.searchParams.set("source", "recovery");
  fallbackUrl.searchParams.set("type", "recovery");

  const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="robots" content="noindex" />
    <title>OpenAA</title>
  </head>
  <body>
    <script>
      const target = new URL(${JSON.stringify(targetUrl.toString())});
      const fallback = ${JSON.stringify(fallbackUrl.toString())};
      if (window.location.hash) {
        target.hash = window.location.hash;
        window.location.replace(target.toString());
      } else {
        window.location.replace(fallback);
      }
    </script>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

function isConsumedSignupConfirmationError(errorCode: string | null, errorDescription: string | null, isRecoveryCallback: boolean) {
  if (isRecoveryCallback) return false;

  const normalized = `${errorCode ?? ""} ${errorDescription ?? ""}`.toLowerCase();

  return normalized.includes("otp_expired") || normalized.includes("email link is invalid or has expired");
}

function recoveryErrorParams(error = recoveryErrorMessage) {
  return {
    error,
    source: "recovery",
    type: "recovery",
  };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
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
    if (isConsumedSignupConfirmationError(callbackErrorCode, errorDescription, isRecoveryCallback)) {
      console.info("[auth/callback] signup confirmation link already consumed or expired", {
        error: callbackError,
        errorCode: callbackErrorCode,
        returnTo,
      });
      return redirectUrl(requestUrl, "/login", signupConfirmationSuccessParams);
    }

    console.error("[auth/callback] provider returned error", {
      error: callbackError,
      errorCode: callbackErrorCode,
      errorDescription,
      callbackType,
      returnTo,
    });
    return redirectUrl(
      requestUrl,
      isRecoveryCallback ? recoveryRedirectTo : "/login",
      isRecoveryCallback
        ? { ...recoveryErrorParams(errorDescription), ...(callbackErrorCode ? { error_code: callbackErrorCode } : {}) }
        : loginErrorParams,
    );
  }

  if (tokenHash && isRecoveryCallback) {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return redirectUrl(requestUrl, recoveryRedirectTo, recoveryErrorParams());
    }

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });

    if (verifyError || !data.session) {
      console.error("[auth/callback] recovery token_hash verification failed", verifyError);
      return redirectUrl(requestUrl, recoveryRedirectTo, recoveryErrorParams());
    }

    return redirectUrl(requestUrl, recoveryRedirectTo, { source: "recovery", type: "recovery" });
  }

  if (!code) {
    if (isRecoveryCallback) {
      return recoveryHashBridgeResponse(requestUrl, recoveryRedirectTo);
    }

    console.error("[auth/callback] missing code", {
      error: callbackError,
      errorCode: callbackErrorCode,
      callbackType,
      returnTo,
    });
    return redirectUrl(
      requestUrl,
      "/login",
      loginErrorParams,
    );
  }

  if (isRecoveryCallback) {
    return redirectUrl(requestUrl, recoveryRedirectTo, { code, source: "recovery", type: "recovery" });
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return redirectUrl(requestUrl, "/login", { error: "登录服务暂时不可用，请稍后再试。" });
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("[auth/callback] exchangeCodeForSession failed", exchangeError);
    return redirectUrl(requestUrl, "/login", loginErrorParams);
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
