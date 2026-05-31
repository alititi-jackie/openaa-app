"use client";

import Link from "next/link";

type SubmitBarProps = {
  cancelHref: string;
  submitting: boolean;
  mode: "create" | "edit";
  error?: string;
};

export function SubmitBar({ cancelHref, submitting, mode, error }: SubmitBarProps) {
  return (
    <div className="sticky bottom-16 z-10 -mx-4 border-t border-slate-100 bg-white/95 px-4 py-3 backdrop-blur">
      {error ? <p className="mb-2 rounded-xl bg-rose-50 px-3 py-2 text-sm leading-5 text-rose-700">{error}</p> : null}
      <div className="grid grid-cols-[1fr_1.4fr] gap-2">
        <Link href={cancelHref} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700">
          取消
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "保存中..." : mode === "create" ? "发布" : "保存修改"}
        </button>
      </div>
    </div>
  );
}
