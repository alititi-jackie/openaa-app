"use client";

import { FavoriteButton } from "@/components/common/FavoriteButton";
import { POST_FAVORITE_TYPE_LABELS } from "@/features/favorites/helpers";
import type { PostType } from "@/features/posts/types";

type DetailFavoriteButtonProps = {
  postId: string;
  postType: PostType;
  title: string;
  returnTo: string;
  initialIsFavorited: boolean;
};

export function DetailFavoriteButton({ postId, postType, title, returnTo, initialIsFavorited }: DetailFavoriteButtonProps) {
  return (
    <FavoriteButton
      target={{ type: postType, id: postId, url: returnTo, title, category: POST_FAVORITE_TYPE_LABELS[postType] }}
      returnTo={returnTo}
      initialIsFavorited={initialIsFavorited}
    />
  );
}
