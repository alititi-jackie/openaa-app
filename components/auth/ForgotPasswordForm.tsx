"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { AuthCard, AuthLink } from "@/components/auth/AuthCard";
import { passwordRecoveryRedirectTo } from "@/lib/auth/confirmationEmail";
import { createSupabasePasswordRecoveryClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const resetEmailSentMessage =
  "重置密码邮件已发送。\n\n如果该邮箱已注册 OpenAA 账号，请查看来自 OpenAA 系统邮件（noreply@mail.app.supabase.io）的重置密码邮件，并点击邮件中的链接重新设置密码。\n\n如果没有看到邮件，请检查垃圾邮件、广告邮件或促销邮件文件夹。邮件可能需要几分钟送达，请不要短时间内重复提交，以免触发邮件发送限制。\n\n如果 1 小时后仍未收到邮件，请再尝试重新提交或联系网站管理员处理。给您带来的不便，我们深表歉意。";

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
      const supabase = createSupabasePasswordRecoveryClient();
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: passwordRecoveryRedirectTo(),
      });

      if (error) {
        setIsSuccess(true);
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

      <form className="space-y-4" onSubmit={handleReset}>
        <label className="block">
          <span className="text-sm font-bold text-slate-800">邮箱地址</span>
          <input
            type="text"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="your@email.com"
            disabled={isSuccess}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-zinc-50"
          />
        </label>
        {isSuccess ? <div className="whitespace-pre-line rounded-lg bg-green-50 p-3 text-sm leading-relaxed text-green-700">{resetEmailSentMessage}</div> : null}
        {message ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{message}</div> : null}
        <button
          type="submit"
          disabled={!isConfigured || isSubmitting || isSuccess}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1976d2] px-4 py-3 text-sm font-black text-white hover:bg-[#1565c0] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <KeyRound size={18} aria-hidden="true" />
          {isSubmitting ? "发送中..." : "发送重置邮件"}
        </button>
      </form>
    </AuthCard>
  );
}
