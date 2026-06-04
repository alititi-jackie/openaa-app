"use client";

import { ArrowUp } from "lucide-react";

export function BackToTopButton() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-20 right-4 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
      aria-label="返回顶部"
    >
      <ArrowUp size={18} aria-hidden="true" />
    </button>
  );
}
