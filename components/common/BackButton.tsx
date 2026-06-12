"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type BackButtonProps = {
  href?: string;
  fallbackHref?: string;
  label?: string;
  className?: string;
};

export const backButtonClassName =
  "inline-flex min-h-10 items-center justify-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50";

export function BackButton({ href, fallbackHref = "/", label = "返回", className = backButtonClassName }: BackButtonProps) {
  const router = useRouter();

  if (href) {
    return (
      <Link href={href} className={className}>
        <ArrowLeft size={16} aria-hidden="true" />
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
      className={className}
    >
      <ArrowLeft size={16} aria-hidden="true" />
      {label}
    </button>
  );
}
