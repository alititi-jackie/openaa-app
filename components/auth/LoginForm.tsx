"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { AuthCard, AuthLink } from "@/components/auth/AuthCard";
import { featureFlags } from "@/lib/config/featureFlags";
import { appUrl } from "@/lib/seo/siteConfig";
import { createSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/profile";
  }

  return value;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get("returnTo"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isConfigured = isSupabaseBrowserConfigured();
  const callbackUrl = useMemo(() => appUrl(`/auth/callback?returnTo=${encodeURIComponent(returnTo)}`), [returnTo]);

  async function handleEmailLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMessage("登录失败，请检查邮箱和密码。");
        return;
      }

      router.replace(returnTo);
      router.refresh();
    } catch {
      setMessage("Supabase 环境变量尚未配置，暂时无法登录。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
        },
      });

      if (error) {
        setMessage("Google 登录启动失败，请稍后再试。");
      }
    } catch {
      setMessage("Supabase 环境变量尚未配置，暂时无法启动 Google 登录。");
    }
  }

  return (
    <AuthCard
      title="登录 OpenAA"
      description="使用邮箱密码或 Google 账号进入你的 OpenAA 资料页。"
      footer={
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <span>
            还没有账号？ <AuthLink href="/register">去注册</AuthLink>
          </span>
          <AuthLink href="/forgot-password">忘记密码</AuthLink>
        </div>
      }
    >
      {!isConfigured ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
          Supabase 环境变量尚未配置。页面可以构建和预览，真实登录会在配置新 Supabase 后启用。
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={handleEmailLogin}>
        <label className="block">
          <span className="text-sm font-bold text-slate-800">邮箱</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-800">密码</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>
        <button
          type="submit"
          disabled={!featureFlags.auth_email || isSubmitting}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Mail size={18} aria-hidden="true" />
          {isSubmitting ? "登录中..." : "邮箱登录"}
        </button>
      </form>

      {featureFlags.auth_google ? (
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="mt-3 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-900"
        >
          Google 登录
        </button>
      ) : null}

      <p className="mt-3 text-xs leading-5 text-slate-500">Apple、微信和手机号登录已预留，当前阶段未启用。</p>
      {message ? <p className="mt-4 rounded-xl bg-slate-100 p-3 text-sm leading-6 text-slate-700">{message}</p> : null}
    </AuthCard>
  );
}
