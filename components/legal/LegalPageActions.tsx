"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type LegalPageActionsProps = {
  registerHref?: string;
};

const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-3 text-sm font-black transition active:scale-[0.99]";
const primaryClass = `${buttonClass} bg-slate-950 text-white`;
const secondaryClass = `${buttonClass} border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700`;

export function LegalPageActions({ registerHref = "/register" }: LegalPageActionsProps) {
  const searchParams = useSearchParams();
  const fromRegister = searchParams.get("returnTo") === "/register";

  return (
    <section className="grid gap-3 rounded-2xl border border-slate-100 bg-white p-4 pb-6 shadow-sm sm:grid-cols-3">
      {fromRegister ? (
        <Link href={registerHref} className={`${primaryClass} sm:col-span-3`}>
          我已阅读，返回注册
        </Link>
      ) : null}
      <button type="button" onClick={() => window.history.back()} className={secondaryClass}>
        返回上一页
      </button>
      <Link href="/register" className={secondaryClass}>
        返回注册页
      </Link>
      <Link href="/" className={secondaryClass}>
        返回首页
      </Link>
    </section>
  );
}
