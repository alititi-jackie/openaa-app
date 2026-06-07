"use client";

import { useRouter } from "next/navigation";
import { DetailFavoriteButton } from "./DetailFavoriteButton";
import { DetailShareButton } from "./DetailShareButton";
import { detailActionButtonClass } from "./detailActionStyles";

type DetailActionBarProps = {
  backHref: string;
  postId: string;
  path: string;
  title: string;
  text: string;
  initialIsFavorited: boolean;
};

export function DetailActionBar({ backHref, postId, path, title, text, initialIsFavorited }: DetailActionBarProps) {
  const router = useRouter();

  function handleBack() {
    const hasPriorPage = typeof window !== "undefined" && (document.referrer !== "" || window.history.length > 2);
    if (hasPriorPage) {
      router.back();
      return;
    }

    router.push(backHref);
  }

  return (
    <div className="flex items-center justify-between">
      <button type="button" onClick={handleBack} className={`z-30 ${detailActionButtonClass}`}>
        ← 返回
      </button>
      <div className="flex items-center gap-2">
        <DetailFavoriteButton postId={postId} returnTo={path} initialIsFavorited={initialIsFavorited} />
        <DetailShareButton path={path} title={title} text={text} />
      </div>
    </div>
  );
}
