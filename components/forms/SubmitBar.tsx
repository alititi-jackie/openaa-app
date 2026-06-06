"use client";

import Link from "next/link";

type SubmitBarProps = {
  cancelHref: string;
  submitting: boolean;
  mode: "create" | "edit";
  error?: string;
  submitLabel?: string;
  onSaveDraft?: () => void;
};

export function SubmitBar({ cancelHref, submitting, mode, error, submitLabel, onSaveDraft }: SubmitBarProps) {
  return (
    <div className="space-y-3">
      {error ? <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm leading-5 text-red-600">{error}</div> : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          type="submit"
          disabled={submitting}
          className="min-h-12 rounded-lg bg-[#1976d2] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#1565c0] disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-1"
        >
          {submitting ? (mode === "create" ? "发布中..." : "保存中...") : (submitLabel ?? (mode === "create" ? "发布" : "保存修改"))}
        </button>
        {onSaveDraft ? (
          <button
            type="button"
            disabled={submitting}
            onClick={onSaveDraft}
            className="min-h-12 rounded-lg bg-white px-4 py-3 text-sm font-medium text-gray-700 ring-1 ring-gray-300 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            保存草稿
          </button>
        ) : null}
        <Link
          href={cancelHref}
          className="min-h-12 rounded-lg bg-white px-4 py-3 text-center text-sm font-medium text-gray-600 ring-1 ring-gray-300 transition hover:bg-gray-50"
        >
          取消
        </Link>
      </div>
    </div>
  );
}
