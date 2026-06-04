"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { safeReturnTo } from "@/lib/auth/redirects";
import { createSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

export function AuthRequiredSessionRedirect() {
  const searchParams = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get("returnTo"));

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) {
      return;
    }

    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) {
        window.location.replace(returnTo);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [returnTo]);

  return null;
}
