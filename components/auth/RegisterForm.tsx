"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { AuthCard, AuthLink } from "@/components/auth/AuthCard";
import { validateNicknameForSave } from "@/features/auth/actions";
import { unavailableNicknameMessage, validateNickname } from "@/features/auth/nicknameValidation";
import {
  accountCreatedConfirmationMessage,
  confirmationEmailRedirectTo,
} from "@/lib/auth/confirmationEmail";
import { authErrorMessage, isAlreadyRegisteredError } from "@/lib/auth/errorMessages";
import { isPasswordLongEnough, MIN_PASSWORD_LENGTH, passwordLengthMessage } from "@/lib/auth/passwordPolicy";
import { featureFlags } from "@/lib/config/featureFlags";
import { createSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

const consentVersion = "2026-05-31";
const accountAlreadyRegisteredMessage =
  "该邮箱可能已经注册过 OpenAA 账号。\n\n如果这是您的邮箱，请直接前往登录页面登录；如果忘记密码，可以使用“忘记密码”重新设置密码。\n\n如果您之前注册后还没有完成邮箱确认，请先检查邮箱中的确认邮件，并点击确认链接完成注册。";

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
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isConfigured = isSupabaseBrowserConfigured();
  const consentHref = `/legal/consent?returnTo=/register&agreed=${accepted ? "1" : "0"}&next=${encodeURIComponent(authReturnTo)}`;
  const loginHref = `/login?returnTo=${encodeURIComponent(authReturnTo)}`;
  const forgotPasswordHref = "/forgot-password";
  const liveNicknameResult = nickname.trim() ? validateNickname(nickname) : null;

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSuccess(false);
    setIsAlreadyRegistered(false);

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
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: confirmationEmailRedirectTo(authReturnTo),
          data: {
            nickname: serverNicknameResult.nickname,
            consent_version: consentVersion,
            accepted_terms: true,
            accepted_privacy: true,
          },
        },
      });

      if (error) {
        if (isAlreadyRegisteredError(error)) {
          setMessage(accountAlreadyRegisteredMessage);
          setIsAlreadyRegistered(true);
          return;
        }

        setMessage(authErrorMessage(error, "注册失败，请重试"));
        return;
      }

      if (data.session) {
        await supabase.auth.signOut();
      }

      setPassword("");
      setConfirmPassword("");
      setAccepted(false);
      setMessage(accountCreatedConfirmationMessage);
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
            onChange={(event) => {
              setEmail(event.target.value);
              if (isAlreadyRegistered) {
                setIsAlreadyRegistered(false);
                setMessage("");
              }
            }}
            disabled={isSuccess}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-zinc-50"
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-800">密码</span>
          <input
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            placeholder={`至少 ${MIN_PASSWORD_LENGTH} 位`}
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
            minLength={MIN_PASSWORD_LENGTH}
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
        {message ? <div className={`whitespace-pre-line rounded-lg p-3 text-sm leading-relaxed ${isSuccess ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{message}</div> : null}
        {isAlreadyRegistered ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href={loginHref}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1976d2] px-4 py-2 text-sm font-black text-white hover:bg-[#1565c0]"
            >
              去登录
            </Link>
            <Link
              href={forgotPasswordHref}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              忘记密码
            </Link>
          </div>
        ) : null}
        {!isSuccess && !isAlreadyRegistered ? (
          <button
            type="submit"
            disabled={!featureFlags.auth_email || !isConfigured || isSubmitting}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1976d2] px-4 py-3 text-sm font-black text-white hover:bg-[#1565c0] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <UserPlus size={18} aria-hidden="true" />
            {isSubmitting ? "注册中..." : "创建账号"}
          </button>
        ) : null}
        {isSuccess ? (
          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <Link
              href={loginHref}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              返回登录
            </Link>
          </div>
        ) : null}
      </form>
    </AuthCard>
  );
}
