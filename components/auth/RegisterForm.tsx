"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { AuthCard, AuthLink } from "@/components/auth/AuthCard";
import { featureFlags } from "@/lib/config/featureFlags";
import { appUrl } from "@/lib/seo/siteConfig";
import { createSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

const consentVersion = "2026-05-31";
const signupSuccessMessage = "注册成功，验证邮件已发送。请到邮箱点击验证链接后再登录；如果没收到，请检查垃圾邮件。";

function registerErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("already registered") || normalized.includes("already exists")) {
    return "这个邮箱可能已经注册过，请直接登录或使用忘记密码。";
  }

  if (normalized.includes("password")) {
    return "注册失败，请确认密码至少 8 位。";
  }

  if (normalized.includes("email")) {
    return "注册失败，请确认邮箱格式正确后再试。";
  }

  return "注册失败，请稍后再试。";
}

function registerFallbackMessage(isConfigured: boolean) {
  return isConfigured ? "注册失败，请稍后再试。" : "Supabase 环境变量尚未配置，暂时无法注册。";
}

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isConfigured = isSupabaseBrowserConfigured();

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSuccess(false);

    if (!accepted) {
      setMessage("请先同意服务条款和隐私政策。");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: appUrl("/auth/callback?returnTo=/profile"),
          data: {
            nickname: nickname.trim(),
            consent_version: consentVersion,
            accepted_terms: true,
            accepted_privacy: true,
          },
        },
      });

      if (error) {
        setMessage(registerErrorMessage(error.message));
        return;
      }

      setPassword("");
      setAccepted(false);
      setIsSuccess(true);
      setMessage(signupSuccessMessage);
    } catch {
      setMessage(registerFallbackMessage(isConfigured));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="注册 OpenAA"
      description="创建账号后，请先完成邮箱验证，再登录管理发布、收藏和个人资料。"
      footer={
        <span>
          已有账号？<AuthLink href="/login">去登录</AuthLink>
        </span>
      }
    >
      {!isConfigured ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
          Supabase 环境变量尚未配置。页面可以构建和预览，真实注册会在配置 Supabase 后启用。
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={handleRegister}>
        <label className="block">
          <span className="text-sm font-bold text-slate-800">昵称</span>
          <input
            type="text"
            required
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>
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
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm leading-6 text-slate-700">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>
            我同意 <Link className="font-bold text-blue-700" href="/terms">服务条款</Link> 和{" "}
            <Link className="font-bold text-blue-700" href="/privacy">隐私政策</Link>。
          </span>
        </label>
        <button
          type="submit"
          disabled={!featureFlags.auth_email || !isConfigured || isSubmitting}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <UserPlus size={18} aria-hidden="true" />
          {isSubmitting ? "注册中..." : "注册"}
        </button>
      </form>
      {message ? (
        <p className={`mt-4 whitespace-pre-line rounded-xl p-3 text-sm leading-6 ${isSuccess ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
          {message}
        </p>
      ) : null}
    </AuthCard>
  );
}
