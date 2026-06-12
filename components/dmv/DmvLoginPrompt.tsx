"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function DmvLoginPromptCard() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  const returnTo = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { authenticated: false }))
      .then((data) => {
        if (!cancelled) setAuthenticated(Boolean(data.authenticated));
      })
      .catch(() => {
        if (!cancelled) setAuthenticated(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (authenticated !== false) return null;

  return (
    <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
      <p className="font-black">登录 OpenAA 后，未来可同步错题和学习进度。</p>
      <p className="mt-1 text-blue-800">当前版本先保存在本机浏览器，不会写入云端学习记录。</p>
      <Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="mt-3 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white">
        登录 / 注册
      </Link>
    </section>
  );
}

export { DmvLoginPromptCard as DmvLoginPrompt };
