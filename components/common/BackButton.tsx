"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type BackButtonProps = {
  fallbackHref?: string;
  label?: string;
};

export function BackButton({ fallbackHref = "/", label = "返回" }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
      className="inline-flex min-h-10 items-center gap-1 rounded-full border border-slate-200 px-3 text-sm font-semibold text-slate-700"
    >
      <ArrowLeft size={16} aria-hidden="true" />
      {label}
    </button>
  );
}
