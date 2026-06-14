"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { removeFavorite } from "@/features/favorites/actions";

export function FavoriteRemoveButton({ favoriteId }: { favoriteId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function onRemove() {
    setMessage("");
    startTransition(async () => {
      const result = await removeFavorite(favoriteId);
      if (result.authRequired && result.loginHref) {
        window.location.href = result.loginHref;
        return;
      }
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onRemove}
        disabled={isPending}
        className="inline-flex min-h-9 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 px-3 text-xs font-black text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "处理中" : "取消收藏"}
      </button>
      {message ? <span className="text-xs font-semibold text-rose-600">{message}</span> : null}
    </span>
  );
}
