"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound } from "lucide-react";
import { AuthCard, AuthLink } from "@/components/auth/AuthCard";
import { createSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const warning = searchParams.get("warning");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(warning ? "登录资料稍后补全，不影响本次重置密码。" : "");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isConfigured = isSupabaseBrowserConfigured();

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSuccess(false);

    if (password.length < 8) {
      setMessage("新密码至少需要 8 位。");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("两次输入的密码不一致。");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage("重置链接无效或已过期，请重新申请密码重置邮件。");
        return;
      }

      await supabase.auth.signOut();
      setPassword("");
      setConfirmPassword("");
      setIsSuccess(true);
      setMessage("密码已更新，请重新登录。");
      window.setTimeout(() => {
        router.replace("/login");
        router.refresh();
      }, 1200);
    } catch {
      setMessage(isConfigured ? "密码更新失败，请稍后再试。" : "Supabase 环境变量尚未配置，暂时无法更新密码。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="重置密码"
      description="请输入新密码。完成后需要重新登录。"
      footer={<AuthLink href="/login">返回登录</AuthLink>}
    >
      {!isConfigured ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
          Supabase 环境变量尚未配置。页面可以构建和预览，真实重置会在配置 Supabase 后启用。
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={handleSave}>
        <label className="block">
          <span className="text-sm font-bold text-slate-800">新密码</span>
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
        <label className="block">
          <span className="text-sm font-bold text-slate-800">确认新密码</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>
        <button
          type="submit"
          disabled={!isConfigured || isSubmitting}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <KeyRound size={18} aria-hidden="true" />
          {isSubmitting ? "更新中..." : "更新密码"}
        </button>
      </form>

      {message ? (
        <p className={`mt-4 rounded-xl p-3 text-sm leading-6 ${isSuccess ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
          {message}
        </p>
      ) : null}
    </AuthCard>
  );
}
