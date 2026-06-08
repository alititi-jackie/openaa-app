"use client";

import { useEffect } from "react";

type ProfilePostConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmTone?: "primary" | "danger";
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ProfilePostConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "好",
  confirmTone = "primary",
  pending = false,
  onCancel,
  onConfirm,
}: ProfilePostConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        onCancel();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel, open, pending]);

  if (!open) return null;
  const confirmClass =
    confirmTone === "danger"
      ? "min-h-11 rounded-xl bg-red-600 px-4 text-[15px] font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      : "min-h-11 rounded-xl bg-blue-600 px-4 text-[15px] font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5 py-8" role="presentation">
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-[320px] rounded-2xl bg-white p-5 text-center shadow-2xl">
        <p className="text-[17px] font-semibold leading-7 text-zinc-950">{title}</p>
        {description ? <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p> : null}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="min-h-11 rounded-xl bg-zinc-100 px-4 text-[15px] font-semibold text-zinc-700 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={confirmClass}
          >
            {pending ? "处理中..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
