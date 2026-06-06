"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { authErrorMessage } from "@/lib/auth/errorMessages";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type NoticeState = {
  type: "error" | "success";
  message: string;
} | null;

type ProfileSecurityFormProps = {
  email: string | null;
  hasPasswordLogin: boolean;
};

const passwordChangedMessage = "密码已修改成功，请重新登录。";

export function ProfileSecurityForm({ email, hasPasswordLogin }: ProfileSecurityFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState<NoticeState>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isFormDisabled = isSubmitting || isSuccess;

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    if (!email) {
      setNotice({ type: "error", message: "请先登录后再修改密码" });
      return;
    }

    if (!currentPassword) {
      setNotice({ type: "error", message: "请输入当前密码" });
      return;
    }

    if (!newPassword) {
      setNotice({ type: "error", message: "请输入新密码" });
      return;
    }

    if (newPassword.length < 6) {
      setNotice({ type: "error", message: "新密码至少需要 6 位" });
      return;
    }

    if (!confirmPassword) {
      setNotice({ type: "error", message: "请再次输入新密码" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setNotice({ type: "error", message: "两次输入的新密码不一致" });
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (verifyError) {
        setCurrentPassword("");
        setNotice({ type: "error", message: "当前密码错误，请重新输入" });
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) {
        setNotice({ type: "error", message: authErrorMessage(updateError, "修改密码失败，请稍后重试") });
        return;
      }

      setIsSuccess(true);
      setNotice({ type: "success", message: passwordChangedMessage });
      window.setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.replace("/login");
      }, 2000);
    } catch {
      setNotice({ type: "error", message: "修改密码失败，请稍后重试" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSave}>
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">修改密码</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">请输入原密码和新密码。修改成功后，请使用新密码重新登录。</p>

        {!hasPasswordLogin ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
            当前账号使用第三方登录，如需设置密码，请使用忘记密码流程。
            <Link href="/forgot-password" className="mt-3 inline-flex min-h-9 items-center justify-center rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-black text-blue-700 hover:bg-blue-50 sm:ml-2 sm:mt-0">
              去重置密码
            </Link>
          </div>
        ) : null}

        {hasPasswordLogin && !isSuccess ? (
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-slate-800">当前密码</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="请输入当前密码"
                disabled={isFormDisabled}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-zinc-50"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-800">新密码</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="请输入新密码"
                disabled={isFormDisabled}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-zinc-50"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-800">确认新密码</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="请再次输入新密码"
                disabled={isFormDisabled}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-zinc-50"
              />
            </label>
          </div>
        ) : null}
      </section>

      {notice && hasPasswordLogin ? (
        <div className={`rounded-xl p-3 text-sm leading-6 ${notice.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {notice.message}
        </div>
      ) : null}

      {hasPasswordLogin && !isSuccess ? (
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1976d2] px-4 py-3 text-sm font-black text-white hover:bg-[#1565c0] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <KeyRound size={18} aria-hidden="true" />
            {isSubmitting ? "正在修改..." : "确认修改"}
          </button>
          <Link
            href="/profile"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            返回我的页面
          </Link>
        </div>
      ) : (
        <Link
          href="/profile"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          返回我的页面
        </Link>
      )}
    </form>
  );
}
