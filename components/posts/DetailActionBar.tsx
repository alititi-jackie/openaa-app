"use client";

import { DetailBackButton } from "@/components/common/DetailBackButton";
import { DetailFavoriteButton } from "./DetailFavoriteButton";
import { DetailShareButton } from "./DetailShareButton";

type DetailActionBarProps = {
  backHref: string;
  postId: string;
  path: string;
  title: string;
  text: string;
  initialIsFavorited: boolean;
};

export function DetailActionBar({ backHref, postId, path, title, text, initialIsFavorited }: DetailActionBarProps) {
  return (
    <div className="flex items-center justify-between">
      <DetailBackButton fallbackHref={backHref} />
      <div className="flex items-center gap-2">
        <DetailFavoriteButton postId={postId} returnTo={path} initialIsFavorited={initialIsFavorited} />
        <DetailShareButton path={path} title={title} text={text} />
      </div>
    </div>
  );
}
