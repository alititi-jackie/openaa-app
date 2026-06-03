"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { KeyRound } from "lucide-react";
import { AuthCard, AuthLink } from "@/components/auth/AuthCard";
import { createSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isConfigured = isSupabaseBrowserConfigured();

  useEffect(() => {
    if (!isConfigured) {
      queueMicrotask(() => setSession(null));
      return;
    }

    const supabase = createSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (event === "PASSWORD_RECOVERY") {
        setSession(currentSession);
      }
    });

    return () => subscription.unsubscribe();
  }, [isConfigured]);

  function validate() {
    let valid = true;

    if (!newPassword) {
      setNewPasswordError("请输入新密码");
      valid = false;
    } else if (newPassword.length < 6) {
      setNewPasswordError("密码至少需要 6 位");
      valid = false;
    } else {
      setNewPasswordError("");
    }

    if (!confirmPassword) {
      setConfirmPasswordError("请再次输入新密码");
      valid = false;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError("两次输入的密码不一致");
      valid = false;
    } else {
      setConfirmPasswordError("");
    }

    return valid;
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) {
        setError(updateError.message || "密码重置失败，请重新打开邮件链接或稍后重试");
        return;
      }

      setIsSuccess(true);
    } catch {
      setError(isConfigured ? "密码重置失败，请重新打开邮件链接或稍后重试" : "Supabase 环境变量尚未配置，暂时无法更新密码。");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (session === undefined) {
    return (
      <AuthCard title="重置密码" description="">
        <div className="text-center text-sm text-zinc-500">正在验证重置链接…</div>
      </AuthCard>
    );
  }

  if (!session) {
    return (
      <AuthCard
        title="重置密码"
        description=""
        footer={
          <span>
            <AuthLink href="/forgot-password">重新申请</AuthLink>
            {" · "}
            <AuthLink href="/login">返回登录</AuthLink>
          </span>
        }
      >
        <div className="rounded-lg bg-red-50 p-4 text-sm leading-relaxed text-red-600">
          重置链接无效或已过期，请重新申请密码重置邮件。
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="重置密码" description="请输入您的新密码。" footer={!isSuccess ? <AuthLink href="/login">返回登录</AuthLink> : null}>
      {isSuccess ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-green-50 p-4 text-sm leading-relaxed text-green-700">密码重置成功，请返回登录页面重新登录。</div>
          <AuthLink href="/login">返回登录</AuthLink>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSave}>
          {error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div> : null}

          <label className="block">
            <span className="text-sm font-bold text-slate-800">新密码</span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value);
                if (newPasswordError) setNewPasswordError("");
              }}
              placeholder="至少 6 位"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            {newPasswordError ? <p className="mt-1 text-xs text-red-500">{newPasswordError}</p> : null}
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-800">确认新密码</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                if (confirmPasswordError) setConfirmPasswordError("");
              }}
              placeholder="再次输入新密码"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            {confirmPasswordError ? <p className="mt-1 text-xs text-red-500">{confirmPasswordError}</p> : null}
          </label>
          <button
            type="submit"
            disabled={!isConfigured || isSubmitting}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <KeyRound size={18} aria-hidden="true" />
            {isSubmitting ? "提交中..." : "确认修改密码"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
