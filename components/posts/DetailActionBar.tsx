"use client";

import { DetailBackButton } from "@/components/common/DetailBackButton";
import type { PostType } from "@/features/posts/types";
import { DetailFavoriteButton } from "./DetailFavoriteButton";
import { DetailShareButton } from "./DetailShareButton";

type DetailActionBarProps = {
  backHref: string;
  postId: string;
  postType: PostType;
  path: string;
  title: string;
  text: string;
  initialIsFavorited: boolean;
};

export function DetailActionBar({ backHref, postId, postType, path, title, text, initialIsFavorited }: DetailActionBarProps) {
  return (
    <div className="flex items-center justify-between">
      <DetailBackButton fallbackHref={backHref} />
      <div className="flex items-center gap-2">
        <DetailFavoriteButton postId={postId} postType={postType} title={title} returnTo={path} initialIsFavorited={initialIsFavorited} />
        <DetailShareButton path={path} title={title} text={text} />
      </div>
    </div>
  );
}
