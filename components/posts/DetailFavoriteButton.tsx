"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { togglePostFavorite } from "@/features/posts/engagementActions";
import { detailActionButtonClass } from "./detailActionStyles";

type DetailFavoriteButtonProps = {
  postId: string;
  returnTo: string;
  initialIsFavorited: boolean;
};

export function DetailFavoriteButton({ postId, returnTo, initialIsFavorited }: DetailFavoriteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [toast, setToast] = useState("");

  function onFavorite() {
    setToast("");
    startTransition(async () => {
      const result = await togglePostFavorite(postId, returnTo);

      if (result.authRequired && result.loginHref) {
        window.location.href = result.loginHref;
        return;
      }

      setToast(result.message);
      if (result.ok && typeof result.isFavorited === "boolean") {
        setIsFavorited(result.isFavorited);
      }
    });
  }

  return (
    <>
      <button type="button" onClick={onFavorite} disabled={isPending} aria-label={isFavorited ? "取消收藏" : "收藏"} aria-pressed={isFavorited} className={detailActionButtonClass}>
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
