"use client";

import { useEffect, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { KeyRound } from "lucide-react";
import { AuthCard, AuthLink } from "@/components/auth/AuthCard";
import { authErrorMessage } from "@/lib/auth/errorMessages";
import { isPasswordLongEnough, MIN_PASSWORD_LENGTH, passwordLengthMessage } from "@/lib/auth/passwordPolicy";
import { createSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

const resetExpiredMessage = "重置链接已失效，请重新发送重置邮件。";
const resetSuccessMessage = "密码已重置，请重新登录。";
const unconfiguredMessage = "Supabase 环境变量尚未配置，暂时无法更新密码。";
const authParamsToClear = ["code", "error", "error_code", "error_description", "message", "type", "source"];

type RecoveryStatus = "checking" | "ready" | "invalid" | "unconfigured";

function cleanRecoveryParamsFromUrl() {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  let changed = false;

  for (const param of authParamsToClear) {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      changed = true;
    }
  }

  if (url.hash) {
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
    const hasAuthHash = ["access_token", "refresh_token", "expires_in", "expires_at", "token_type", "type", "error", "error_code", "error_description"].some(
      (param) => hashParams.has(param),
    );

    if (hasAuthHash) {
      url.hash = "";
      changed = true;
    }
  }

  if (changed) {
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }
}

function recoveryErrorFromParams(params: URLSearchParams) {
  return params.get("error_description") || params.get("message") || params.get("error") || "";
}

function resetLinkErrorMessage(error: unknown) {
  const message = authErrorMessage(error, resetExpiredMessage);

  if (message.includes("链接已失效") || message.includes("登录状态已失效")) {
    return resetExpiredMessage;
  }

  return message;
}

async function readCurrentSession(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

export function ResetPasswordForm() {
  const [status, setStatus] = useState<RecoveryStatus>("checking");
  const [session, setSession] = useState<Session | null>(null);
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
      queueMicrotask(() => {
        setStatus("unconfigured");
        setSession(null);
      });
      return;
    }

    let isMounted = true;
    const supabase = createSupabaseBrowserClient({ detectSessionInUrl: false });

    function markReady(currentSession: Session) {
      if (!isMounted) return;
      setSession(currentSession);
      setError("");
      setStatus("ready");
      cleanRecoveryParamsFromUrl();
    }

    function markInvalid(message = resetExpiredMessage) {
      if (!isMounted) return;
      setSession(null);
      setError(message);
      setStatus("invalid");
      cleanRecoveryParamsFromUrl();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (event === "PASSWORD_RECOVERY" && currentSession) {
        markReady(currentSession);
      }
    });

    async function establishRecoverySession() {
      try {
        const url = new URL(window.location.href);
        const queryError = recoveryErrorFromParams(url.searchParams);

        if (queryError) {
          markInvalid(resetLinkErrorMessage(queryError));
          return;
        }

        const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
        const hashError = recoveryErrorFromParams(hashParams);

        if (hashError) {
          markInvalid(resetLinkErrorMessage(hashError));
          return;
        }

        const code = url.searchParams.get("code");
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error("[auth/reset-password] exchangeCodeForSession failed", exchangeError);
            markInvalid(resetLinkErrorMessage(exchangeError));
            return;
          }

          const currentSession = data.session ?? (await readCurrentSession(supabase));

          if (currentSession) {
            markReady(currentSession);
            return;
          }

          markInvalid();
          return;
        }

        if (accessToken || refreshToken) {
          if (!accessToken || !refreshToken) {
            markInvalid();
            return;
          }

          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error("[auth/reset-password] setSession failed", sessionError);
            markInvalid(resetLinkErrorMessage(sessionError));
            return;
          }

          const currentSession = data.session ?? (await readCurrentSession(supabase));

          if (currentSession) {
            markReady(currentSession);
            return;
          }

          markInvalid();
          return;
        }

        const currentSession = await readCurrentSession(supabase);

        if (currentSession) {
          markReady(currentSession);
          return;
        }

        markInvalid();
      } catch (sessionError) {
        console.error("[auth/reset-password] recovery session setup failed", sessionError);
        markInvalid(resetLinkErrorMessage(sessionError));
      }
    }

    void establishRecoverySession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  function validate() {
    let valid = true;

    if (!newPassword) {
      setNewPasswordError("请输入新密码");
      valid = false;
    } else if (!isPasswordLongEnough(newPassword)) {
      setNewPasswordError(passwordLengthMessage());
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
        setError(resetLinkErrorMessage(updateError));
        return;
      }

      setIsSuccess(true);
      window.setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.replace("/login");
      }, 2000);
    } catch {
      setError(isConfigured ? resetExpiredMessage : unconfiguredMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === "checking") {
    return (
      <AuthCard title="重置密码" description="">
        <div className="text-center text-sm text-zinc-500">正在验证重置链接…</div>
      </AuthCard>
    );
  }

  if (status === "unconfigured") {
    return (
      <AuthCard title="重置密码" description="">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-800">
          {unconfiguredMessage}
        </div>
      </AuthCard>
    );
  }

  if (status === "invalid" || !session) {
    return (
      <AuthCard
        title="重置密码"
        description=""
        footer={
          <span>
            <AuthLink href="/forgot-password">重新发送重置邮件</AuthLink>
            {" · "}
            <AuthLink href="/login">返回登录</AuthLink>
          </span>
        }
      >
        <div className="rounded-lg bg-red-50 p-4 text-sm leading-relaxed text-red-600">
          {error || resetExpiredMessage}
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="重置密码" description="请输入您的新密码。" footer={!isSuccess ? <AuthLink href="/login">返回登录</AuthLink> : null}>
      <form className="space-y-4" onSubmit={handleSave}>
        <label className="block">
          <span className="text-sm font-bold text-slate-800">新密码</span>
          <input
            type="password"
            minLength={MIN_PASSWORD_LENGTH}
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
              if (newPasswordError) setNewPasswordError("");
            }}
            placeholder={`至少 ${MIN_PASSWORD_LENGTH} 位`}
            disabled={isSuccess}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-zinc-50"
          />
          {newPasswordError ? <p className="mt-1 text-xs text-red-500">{newPasswordError}</p> : null}
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-800">确认新密码</span>
          <input
            type="password"
            minLength={MIN_PASSWORD_LENGTH}
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              if (confirmPasswordError) setConfirmPasswordError("");
            }}
            placeholder="再次输入新密码"
            disabled={isSuccess}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-zinc-50"
          />
          {confirmPasswordError ? <p className="mt-1 text-xs text-red-500">{confirmPasswordError}</p> : null}
        </label>
        {isSuccess ? <div className="rounded-lg bg-green-50 p-3 text-sm leading-relaxed text-green-700">{resetSuccessMessage}</div> : null}
        {error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div> : null}
        <button
          type="submit"
          disabled={!isConfigured || isSubmitting || isSuccess}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1976d2] px-4 py-3 text-sm font-black text-white hover:bg-[#1565c0] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <KeyRound size={18} aria-hidden="true" />
          {isSubmitting ? "提交中..." : "确认修改密码"}
        </button>
      </form>
    </AuthCard>
  );
}
