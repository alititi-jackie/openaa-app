"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { AuthCard, AuthLink } from "@/components/auth/AuthCard";
import { validateNickname } from "@/features/auth/nicknameValidation";
import { featureFlags } from "@/lib/config/featureFlags";
import { appUrl } from "@/lib/seo/siteConfig";
import { createSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

const consentVersion = "2026-05-31";

function registerFallbackMessage(isConfigured: boolean) {
  return isConfigured ? "注册失败，请重试" : "Supabase 环境变量尚未配置，暂时无法注册。";
}

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    const nicknameResult = validateNickname(nickname);

    if (!nicknameResult.ok) {
      setMessage(nicknameResult.message);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("两次密码不一致");
      return;
    }

    if (password.length < 6) {
      setMessage("密码至少需要6个字符");
      return;
    }

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
            nickname: nicknameResult.nickname,
            consent_version: consentVersion,
            accepted_terms: true,
            accepted_privacy: true,
          },
        },
      });

      if (error) {
        setMessage(error.message || "注册失败，请重试");
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setAccepted(false);
      setIsSuccess(true);
    } catch {
      setMessage(registerFallbackMessage(isConfigured));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <AuthCard title="注册成功！" description="请打开您的邮箱完成确认。" footer={<AuthLink href="/login">返回登录页面</AuthLink>}>
        <div className="space-y-3 text-sm leading-6 text-slate-700">
          <p>请打开您的邮箱，查收来自 Supabase Auth（noreply@mail.app.supabase.io）的确认邮件，并点击邮件中的 Confirm your mail / 确认邮箱 链接。</p>
          <p>邮箱确认完成后，请回到您刚才注册 OpenAA 的页面重新登录；也可以在确认成功页面点击“前往登录”按钮登录。</p>
          <p className="text-slate-500">如果没有收到确认邮件，请检查垃圾邮件箱，或稍后重新注册/重试。</p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="注册 OpenAA"
      description=""
      footer={
        <span>
          已有账号？ <AuthLink href="/login">立即登录</AuthLink>
        </span>
      }
    >
      {!isConfigured ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
          Supabase 环境变量尚未配置。页面可以构建和预览，真实注册会在配置新 Supabase 后启用。
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={handleRegister}>
        {message ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{message}</div> : null}

        <label className="block">
          <span className="text-sm font-bold text-slate-800">用户名</span>
          <input
            type="text"
            required
            minLength={4}
            placeholder="请输入用户名"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-800">邮箱地址</span>
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="your@email.com"
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
            minLength={6}
            autoComplete="new-password"
            placeholder="至少6个字符"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-800">确认密码</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="再次输入密码"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
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
          {isSubmitting ? "注册中..." : "创建账号"}
        </button>
      </form>
    </AuthCard>
  );
}
