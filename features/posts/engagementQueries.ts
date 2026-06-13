import "server-only";

import { getFavoriteState } from "@/features/favorites/queries";
import { POST_FAVORITE_TYPE_LABELS } from "@/features/favorites/helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { postHref } from "./formMappers";
import type { PostType } from "./types";

export type PostEngagementState = {
  isAuthenticated: boolean;
  isFavorited: boolean;
  hasReported: boolean;
};

export async function getPostEngagementState(postId: string, postType: PostType, title: string): Promise<PostEngagementState> {
  const empty: PostEngagementState = {
    isAuthenticated: false,
    isFavorited: false,
    hasReported: false,
  };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return empty;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return empty;

  const [isFavorited, reportResult] = await Promise.all([
    getFavoriteState({ type: postType, id: postId, url: postHref(postType, postId), title, category: POST_FAVORITE_TYPE_LABELS[postType] }),
    supabase.from("post_reports").select("id").eq("post_id", postId).eq("reporter_id", user.id).maybeSingle(),
  ]);

  return {
    isAuthenticated: true,
    isFavorited,
    hasReported: Boolean(reportResult.data?.id),
  };
}
