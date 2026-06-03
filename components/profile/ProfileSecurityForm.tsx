"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type NoticeState = {
  type: "error" | "success";
  message: string;
} | null;

type ProfileSecurityFormProps = {
  email: string | null;
};

export function ProfileSecurityForm({ email }: ProfileSecurityFormProps) {
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
      setNotice({ type: "error", message: "请输入原密码" });
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
        setNotice({ type: "error", message: "原密码不正确，请重新输入" });
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) {
        setNotice({ type: "error", message: updateError.message || "修改密码失败，请稍后重试" });
        return;
      }

      await supabase.auth.signOut();
      setIsSuccess(true);
      setNotice({ type: "success", message: "密码修改成功，请使用新密码重新登录。" });
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

        {notice ? (
          <div className={`mt-4 rounded-lg p-3 text-sm ${notice.type === "success" ? "bg-zinc-50 text-zinc-600" : "bg-red-50 text-red-600"}`}>
            {notice.message}
          </div>
        ) : null}

        {!isSuccess ? (
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-slate-800">原密码</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="请输入原密码"
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

      {!isSuccess ? (
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <KeyRound size={18} aria-hidden="true" />
          {isSubmitting ? "正在修改..." : "确认修改"}
        </button>
      ) : null}
    </form>
  );
}
