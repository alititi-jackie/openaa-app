"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toggleFavorite } from "@/features/favorites/actions";
import type { FavoriteTarget } from "@/features/favorites/types";
import { cn } from "@/lib/utils/cn";
import { detailActionButtonClass } from "./detailActionStyles";

type FavoriteButtonProps = {
  target: FavoriteTarget;
  returnTo?: string;
  initialIsFavorited?: boolean;
  className?: string;
  compact?: boolean;
};

export function FavoriteButton({
  target,
  returnTo = target.url,
  initialIsFavorited = false,
  className = detailActionButtonClass,
  compact = false,
}: FavoriteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [toast, setToast] = useState("");
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  function showToast(message: string) {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 2200);
  }

  function onFavorite() {
    setToast("");
    startTransition(async () => {
      const result = await toggleFavorite(target, returnTo);

      if (result.authRequired && result.loginHref) {
        window.location.href = result.loginHref;
        return;
      }

      showToast(result.message);
      if (result.ok && typeof result.isFavorited === "boolean") {
        setIsFavorited(result.isFavorited);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={onFavorite}
        disabled={isPending}
        aria-label={isFavorited ? "取消收藏" : "收藏"}
        aria-pressed={isFavorited}
        className={cn(className, compact && "px-3")}
      >
        <span className="inline-flex items-center gap-1.5">
          <Star size={15} className={isFavorited ? "fill-blue-600 text-blue-600" : "text-blue-600"} aria-hidden="true" />
          {compact ? null : <span>{isPending ? "处理中" : isFavorited ? "已收藏" : "收藏"}</span>}
        </span>
      </button>
      {toast ? (
        <div role="status" aria-live="polite" className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-zinc-800 px-4 py-2 text-sm text-white">
          {toast}
        </div>
      ) : null}
    </>
  );
}
