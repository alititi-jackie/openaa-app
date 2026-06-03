"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { AuthCard, AuthLink } from "@/components/auth/AuthCard";
import { appUrl } from "@/lib/seo/siteConfig";
import { createSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isConfigured = isSupabaseBrowserConfigured();

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: appUrl("/auth/callback?returnTo=/reset-password"),
      });

      setMessage(
        error
          ? "重置邮件发送失败，请稍后再试。"
          : "如果该邮箱已注册，我们已发送密码重置邮件。请打开邮箱点击链接设置新密码；如果没收到，请检查垃圾邮件。",
      );
    } catch {
      setMessage(isConfigured ? "重置邮件发送失败，请稍后再试。" : "Supabase 环境变量尚未配置，暂时无法发送重置邮件。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="忘记密码"
      description="输入注册邮箱，我们会发送密码重置邮件。"
      footer={<AuthLink href="/login">返回登录</AuthLink>}
    >
      {!isConfigured ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
          Supabase 环境变量尚未配置。页面可以构建和预览，真实邮件会在配置 Supabase 后启用。
        </p>
      ) : null}
      <form className="space-y-4" onSubmit={handleReset}>
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
        <button
          type="submit"
          disabled={!isConfigured || isSubmitting}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <KeyRound size={18} aria-hidden="true" />
          {isSubmitting ? "发送中..." : "发送重置邮件"}
        </button>
      </form>
      {message ? <p className="mt-4 whitespace-pre-line rounded-xl bg-slate-100 p-3 text-sm leading-6 text-slate-700">{message}</p> : null}
    </AuthCard>
  );
}
