"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ProfileLogoutButton({ variant = "default" }: { variant?: "default" | "compact" }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleLogout() {
    setIsPending(true);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        setMessage("退出登录失败，请稍后再试。");
        return;
      }

      router.replace("/profile");
      router.refresh();
    } catch {
      setMessage("退出登录失败，请稍后再试。");
    } finally {
      setIsPending(false);
    }
  }

  if (variant === "compact") {
    return (
      <div>
        <button type="button" onClick={handleLogout} disabled={isPending} className="w-full p-4 transition hover:bg-red-50 disabled:opacity-60">
          <span className="block w-full text-center font-medium text-red-600">{isPending ? "正在退出" : "退出登录"}</span>
        </button>
        {message ? <p className="px-4 pb-4 text-center text-xs font-bold text-red-600">{message}</p> : null}
      </div>
    );
  }

  return (
    <div className="col-span-2 grid gap-2 sm:col-span-1">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isPending}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogOut size={17} aria-hidden="true" />
        {isPending ? "正在退出" : "退出登录"}
      </button>
      {message ? <p className="text-xs font-bold text-red-600">{message}</p> : null}
    </div>
  );
}
