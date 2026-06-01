import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PostEngagementState = {
  isAuthenticated: boolean;
  isFavorited: boolean;
  hasReported: boolean;
};

export async function getPostEngagementState(postId: string): Promise<PostEngagementState> {
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

  const [favoriteResult, reportResult] = await Promise.all([
    supabase.from("post_favorites").select("id").eq("post_id", postId).eq("user_id", user.id).maybeSingle(),
    supabase.from("post_reports").select("id").eq("post_id", postId).eq("reporter_id", user.id).maybeSingle(),
  ]);

  return {
    isAuthenticated: true,
    isFavorited: Boolean(favoriteResult.data?.id),
    hasReported: Boolean(reportResult.data?.id),
  };
}
