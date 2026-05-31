"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { AuthCard, AuthLink } from "@/components/auth/AuthCard";
import { featureFlags } from "@/lib/config/featureFlags";
import { appUrl } from "@/lib/seo/siteConfig";
import { createSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

const consentVersion = "2026-05-31";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isConfigured = isSupabaseBrowserConfigured();

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!accepted) {
      setMessage("请先同意服务条款和隐私政策。");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: appUrl("/auth/callback?returnTo=/profile"),
          data: {
            nickname,
            consent_version: consentVersion,
            accepted_terms: true,
            accepted_privacy: true,
          },
        },
      });

      if (error) {
        setMessage("注册失败，请确认邮箱格式和密码长度后重试。");
        return;
      }

      if (data.user && data.session) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email: data.user.email,
          nickname,
          email_verified: Boolean(data.user.email_confirmed_at),
        });
        await supabase.from("user_consents").upsert([
          {
            user_id: data.user.id,
            consent_type: "terms",
            consent_version: consentVersion,
            metadata: { source: "register" },
          },
          {
            user_id: data.user.id,
            consent_type: "privacy",
            consent_version: consentVersion,
            metadata: { source: "register" },
          },
        ]);
      }

      setMessage("注册请求已提交。请根据 Supabase 项目设置检查邮箱确认，或直接前往资料页。");
    } catch {
      setMessage("Supabase 环境变量尚未配置，暂时无法注册。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="注册 OpenAA"
      description="创建账号后会预留基础 profile 和用户协议同意记录。"
      footer={
        <span>
          已有账号？ <AuthLink href="/login">去登录</AuthLink>
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
          disabled={!featureFlags.auth_email || isSubmitting}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <UserPlus size={18} aria-hidden="true" />
          {isSubmitting ? "注册中..." : "注册"}
        </button>
      </form>
      {message ? <p className="mt-4 rounded-xl bg-slate-100 p-3 text-sm leading-6 text-slate-700">{message}</p> : null}
    </AuthCard>
  );
}
