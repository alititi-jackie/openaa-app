"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { AuthCard, AuthLink } from "@/components/auth/AuthCard";
import { validateNicknameForSave } from "@/features/auth/actions";
import { unavailableNicknameMessage, validateNickname } from "@/features/auth/nicknameValidation";
import { authErrorMessage } from "@/lib/auth/errorMessages";
import { isPasswordLongEnough, passwordLengthMessage } from "@/lib/auth/passwordPolicy";
import { featureFlags } from "@/lib/config/featureFlags";
import { appUrl } from "@/lib/seo/siteConfig";
import { createSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

const consentVersion = "2026-05-31";

function registerFallbackMessage(isConfigured: boolean) {
  return isConfigured ? "注册失败，请重试" : "Supabase 环境变量尚未配置，暂时无法注册。";
}

type RegisterFormProps = {
  authReturnTo?: string;
  initialAccepted?: boolean;
};

export function RegisterForm({ authReturnTo = "/profile", initialAccepted = false }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [accepted, setAccepted] = useState(initialAccepted);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isConfigured = isSupabaseBrowserConfigured();
  const consentHref = `/legal/consent?returnTo=/register&agreed=${accepted ? "1" : "0"}&next=${encodeURIComponent(authReturnTo)}`;
  const loginHref = `/login?returnTo=${encodeURIComponent(authReturnTo)}`;
  const liveNicknameResult = nickname.trim() ? validateNickname(nickname) : null;

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

    if (!isPasswordLongEnough(password)) {
      setMessage(passwordLengthMessage());
      return;
    }

    if (!accepted) {
      setMessage("请先同意服务条款和隐私政策。");
      return;
    }

    setIsSubmitting(true);

    try {
      const serverNicknameResult = await validateNicknameForSave(nickname);

      if (!serverNicknameResult.ok) {
        setMessage(serverNicknameResult.message);
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: appUrl(`/auth/callback?returnTo=${encodeURIComponent(authReturnTo)}`),
          data: {
            nickname: serverNicknameResult.nickname,
            consent_version: consentVersion,
            accepted_terms: true,
            accepted_privacy: true,
          },
        },
      });

      if (error) {
        setMessage(authErrorMessage(error, "注册失败，请重试"));
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setAccepted(false);
      setMessage("注册成功！请打开您的邮箱完成确认。");
      setIsSuccess(true);
    } catch {
      setMessage(registerFallbackMessage(isConfigured));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="注册 OpenAA"
      description=""
      footer={
        <span>
          已有账号？ <AuthLink href={loginHref}>立即登录</AuthLink>
        </span>
      }
    >
      {!isConfigured ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
          Supabase 环境变量尚未配置。页面可以构建和预览，真实注册会在配置新 Supabase 后启用。
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={handleRegister}>
        <label className="block">
          <span className="text-sm font-bold text-slate-800">用户名</span>
          <input
            type="text"
            required
            minLength={4}
            placeholder="请输入用户名"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            disabled={isSuccess}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-zinc-50"
          />
          {liveNicknameResult?.ok === false && liveNicknameResult.message === unavailableNicknameMessage ? (
            <p className="mt-2 text-sm font-bold text-red-600">{unavailableNicknameMessage}</p>
          ) : null}
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
            disabled={isSuccess}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-zinc-50"
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
            disabled={isSuccess}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-zinc-50"
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
            disabled={isSuccess}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-zinc-50"
          />
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm leading-6 text-slate-700">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            disabled={isSuccess}
            className="mt-1 h-4 w-4"
          />
          <span>
            我同意 <Link className="font-bold text-blue-700" href={consentHref}>服务条款</Link> 和{" "}
            <Link className="font-bold text-blue-700" href={consentHref}>隐私政策</Link>。
          </span>
        </label>
        {message ? <div className={`rounded-lg p-3 text-sm ${isSuccess ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{message}</div> : null}
        <button
          type="submit"
          disabled={!featureFlags.auth_email || !isConfigured || isSubmitting || isSuccess}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1976d2] px-4 py-3 text-sm font-black text-white hover:bg-[#1565c0] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <UserPlus size={18} aria-hidden="true" />
          {isSubmitting ? "注册中..." : "创建账号"}
        </button>
        {isSuccess ? (
          <div className="space-y-2 text-sm leading-6 text-slate-600">
            <p>请查收确认邮件，并点击邮件中的确认邮箱链接。</p>
            <p className="text-slate-500">如果没有收到确认邮件，请检查垃圾邮件箱，或稍后重新注册/重试。</p>
          </div>
        ) : null}
      </form>
    </AuthCard>
  );
}
