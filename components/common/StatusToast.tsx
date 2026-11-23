"use client";
import { useCallback, useEffect, useRef, useState } from "react";
export function useStatusToast() {
  const [toast, setToast] = useState("");
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 2500);
  }, []);
  return [toast, showToast] as const;
}
export function StatusToast({ toast }: { toast: string }) {
  return (
    <>
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-zinc-800 px-4 py-2 text-sm text-white"
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
