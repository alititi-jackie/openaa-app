"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const dmvBackLinkClassName =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.99]";

type DmvBackLinkProps = {
  href?: string;
  label?: string;
  className?: string;
};

export function DmvBackLink({ href = "/dmv", label = "返回 DMV 首页", className }: DmvBackLinkProps) {
  return (
    <Link href={href} className={cn(dmvBackLinkClassName, className)}>
      <ArrowLeft size={16} aria-hidden="true" />
      {label}
    </Link>
  );
}
