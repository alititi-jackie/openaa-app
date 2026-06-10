"use client";

import { FavoriteButton } from "@/components/common/FavoriteButton";

type DetailFavoriteButtonProps = {
  postId: string;
  returnTo: string;
  initialIsFavorited: boolean;
};

export function DetailFavoriteButton({ postId, returnTo, initialIsFavorited }: DetailFavoriteButtonProps) {
  return <FavoriteButton target={{ type: "post", id: postId }} returnTo={returnTo} initialIsFavorited={initialIsFavorited} />;
}
