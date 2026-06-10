"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { togglePostFavorite } from "@/features/posts/engagementActions";
import { detailActionButtonClass } from "./detailActionStyles";

type FavoriteTarget =
  | {
      type: "post";
      id: string;
    }
  | {
      type: "unsupported";
      message?: string;
    };

type FavoriteButtonProps = {
  target: FavoriteTarget;
  returnTo: string;
  initialIsFavorited?: boolean;
  className?: string;
  unsupportedMessage?: string;
};

const defaultUnsupportedMessage = "当前页面收藏功能暂未接入收藏系统。";

export function FavoriteButton({
  target,
  returnTo,
  initialIsFavorited = false,
  className = detailActionButtonClass,
  unsupportedMessage = defaultUnsupportedMessage,
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
    toastTimerRef.current = setTimeout(() => setToast(""), 2500);
  }

  function onFavorite() {
    if (target.type === "unsupported") {
      showToast(target.message ?? unsupportedMessage);
      return;
    }

    setToast("");
    startTransition(async () => {
      const result = await togglePostFavorite(target.id, returnTo);

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
      <button type="button" onClick={onFavorite} disabled={isPending} aria-label={isFavorited ? "取消收藏" : "收藏"} aria-pressed={isFavorited} className={className}>
        <span className="inline-flex items-center gap-1.5">
          <Heart size={15} className={isFavorited ? "fill-blue-600 text-blue-600" : "text-blue-600"} aria-hidden="true" />
          <span>{isPending ? "处理中" : isFavorited ? "已收藏" : "收藏"}</span>
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
