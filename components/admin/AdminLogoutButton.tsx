"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export const adminNavigationButtonClassName =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

export function AdminLogoutButton() {
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);

    try {
      const supabase = createSupabaseBrowserClient();
      await Promise.race([
        supabase.auth.signOut({ scope: "local" }),
        new Promise((resolve) => {
          window.setTimeout(resolve, 2000);
        }),
      ]);
    } finally {
      window.location.assign("/");
    }
  }

  return (
    <button type="button" onClick={handleLogout} disabled={isPending} className={adminNavigationButtonClassName}>
      <LogOut size={16} aria-hidden="true" />
      {isPending ? "正在退出" : "退出登录"}
    </button>
  );
}
