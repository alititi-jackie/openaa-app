"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { featureFlags } from "@/lib/config/featureFlags";
import { authErrorMessage } from "@/lib/auth/errorMessages";
import { safeReturnTo } from "@/lib/auth/redirects";
import { createSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

function loginFallbackMessage(isConfigured: boolean) {
  return isConfigured ? "邮箱或密码不正确。" : "Supabase 环境变量尚未配置，暂时无法登录。";
}

const recoveryErrorMessage = "重置链接已失效，请重新发送重置邮件。";
const authParamNames = ["error", "error_code", "error_description", "message", "type", "source", "autoRedirect"];
const loginSuccessMessage = "登录成功";

type AuthParams = Pick<URLSearchParams, "get" | "has">;

function isRecoveryParams(params: AuthParams) {
  return params.get("type") === "recovery" || params.get("source") === "recovery";
}

function isLoginParams(params: AuthParams) {
  return params.get("source") === "login" || params.get("source") === "oauth";
}

function getInitialLoginMessage(searchParams: AuthParams) {
  const hasMessage = searchParams.has("error") || searchParams.has("message") || searchParams.has("error_description");

  if (!hasMessage) {
    return "";
  }

  if (isRecoveryParams(searchParams)) {
    return recoveryErrorMessage;
  }

  if (isLoginParams(searchParams)) {
    const rawMessage = searchParams.get("message") || searchParams.get("error_description") || searchParams.get("error") || "";
    return rawMessage === loginSuccessMessage ? rawMessage : authErrorMessage(rawMessage);
  }

  return "";
}

function readHashLoginMessage() {
  if (typeof window === "undefined" || !window.location.hash) {
    return "";
  }

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const hasMessage = hashParams.has("error") || hashParams.has("message") || hashParams.has("error_description");

  return hasMessage && isRecoveryParams(hashParams) ? recoveryErrorMessage : "";
}

function clearAuthParamsFromUrl() {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  let changed = Boolean(url.hash);

  for (const param of authParamNames) {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      changed = true;
    }
  }

  if (changed) {
    const search = url.searchParams.toString();
    window.history.replaceState(window.history.state, "", `${url.pathname}${search ? `?${search}` : ""}`);
  }
}

function authCallbackUrl(returnTo: string) {
  const url = new URL("/auth/callback", window.location.origin);
  url.searchParams.set("returnTo", returnTo);
  return url.toString();
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get("returnTo"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(() => getInitialLoginMessage(searchParams));
  const [isLoginSuccess, setIsLoginSuccess] = useState(() => message === loginSuccessMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const isConfigured = isSupabaseBrowserConfigured();

  useEffect(() => {
    const hashMessage = readHashLoginMessage();

    if (hashMessage) {
      queueMicrotask(() => setMessage(hashMessage));
    }

    if (hashMessage || searchParams.has("error") || searchParams.has("message") || searchParams.has("type")) {
      clearAuthParamsFromUrl();
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoginSuccess) return;

    const timer = window.setTimeout(() => {
      window.location.replace(returnTo);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [isLoginSuccess, returnTo]);

  async function handleEmailLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsLoginSuccess(false);
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error("[auth/login] password login failed", {
          message: error.message,
          status: error.status,
        });
        setMessage(authErrorMessage(error, "邮箱或密码不正确。"));
        return;
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setMessage(loginFallbackMessage(isConfigured));
        return;
      }

      setMessage(loginSuccessMessage);
      setIsLoginSuccess(true);
    } catch (error) {
      console.error("[auth/login] password login unexpected error", error);
      setMessage(loginFallbackMessage(isConfigured));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setMessage("");
    setIsLoginSuccess(false);
    clearAuthParamsFromUrl();
    setIsGoogleSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: authCallbackUrl(returnTo),
        },
      });

      if (error) {
        setMessage(authErrorMessage(error, "Google 登录失败，请重试"));
        setIsGoogleSubmitting(false);
      }
    } catch {
      setMessage(isConfigured ? "Google 登录失败，请重试" : "Supabase 环境变量尚未配置，暂时无法启动 Google 登录。");
      setIsGoogleSubmitting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-center text-2xl font-bold text-gray-900">登录 OpenAA</h1>

      <div className="mb-6 mt-3 text-center">
        <p className="text-[13.5px] leading-relaxed text-zinc-500">登录后即可免费发布二手商品、招聘信息，管理您的内容并享受更多OpenAA服务。</p>
      </div>

      {!isConfigured ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
          Supabase 环境变量尚未配置。页面可以构建和预览，真实登录会在配置新 Supabase 后启用。
        </p>
      ) : null}

      {featureFlags.auth_google ? (
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={!isConfigured || isGoogleSubmitting || isSubmitting || isLoginSuccess}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 px-4 py-2.5 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <GoogleIcon />
          {isGoogleSubmitting ? "登录中..." : "使用 Google 登录"}
        </button>
      ) : null}

      {featureFlags.auth_google ? (
        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">或</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleEmailLogin}>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">邮箱地址</span>
          <input
            type="email"
            required
            placeholder="your@email.com"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-transparent focus:ring-2 focus:ring-[#1976d2]"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">密码</span>
          <input
            type="password"
            required
            placeholder="请输入密码"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-transparent focus:ring-2 focus:ring-[#1976d2]"
          />
        </label>
        {message ? (
          <div className={`rounded-lg p-3 text-sm ${isLoginSuccess ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
            {message}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={!featureFlags.auth_email || !isConfigured || isSubmitting || isGoogleSubmitting || isLoginSuccess}
          className="w-full rounded-lg bg-[#1976d2] py-2.5 font-medium text-white transition hover:bg-[#1565c0] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "登录中..." : "登录"}
        </button>
      </form>

      <p className="mt-3 text-center text-sm text-gray-500">
        <Link href="/forgot-password" className="text-[#1976d2] hover:underline">
          忘记密码？
        </Link>
      </p>

      <p className="mt-4 text-center text-sm text-gray-600">
        还没有账号？{" "}
        <Link href="/register" className="font-medium text-[#1976d2] hover:underline">
          立即注册
        </Link>
      </p>
    </section>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
