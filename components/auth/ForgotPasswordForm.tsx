"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { AuthCard, AuthLink } from "@/components/auth/AuthCard";
import { appUrl } from "@/lib/seo/siteConfig";
import { createSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const resetEmailSentMessage = "如果该邮箱已注册，重置密码邮件将发送到该邮箱。";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isConfigured = isSupabaseBrowserConfigured();

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSuccess(false);

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setMessage("请输入邮箱");
      return;
    }

    if (!emailRegex.test(normalizedEmail)) {
      setMessage("请输入有效的邮箱地址");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: appUrl("/auth/callback?returnTo=/reset-password"),
      });

      if (error) {
        setMessage("发送失败，请稍后重试");
        return;
      }

      setIsSuccess(true);
    } catch {
      setMessage(isConfigured ? "发送失败，请稍后重试" : "Supabase 环境变量尚未配置，暂时无法发送重置邮件。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="忘记密码"
      description="请输入您的注册邮箱，我们会发送一封密码重置邮件。"
      footer={<AuthLink href="/login">返回登录</AuthLink>}
    >
      {!isConfigured ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
          Supabase 环境变量尚未配置。页面可以构建和预览，真实邮件会在配置新 Supabase 后启用。
        </p>
      ) : null}

      {isSuccess ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-green-50 p-4 text-sm leading-relaxed text-green-700">
            {resetEmailSentMessage}
          </div>
          <p className="text-center text-xs text-zinc-400">如果没有收到邮件，请检查垃圾邮件箱，或稍后重试。</p>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleReset}>
          {message ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{message}</div> : null}

          <label className="block">
            <span className="text-sm font-bold text-slate-800">邮箱地址</span>
            <input
              type="text"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="your@email.com"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <button
            type="submit"
            disabled={!isConfigured || isSubmitting}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <KeyRound size={18} aria-hidden="true" />
            {isSubmitting ? "发送中..." : "发送重置邮件"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
