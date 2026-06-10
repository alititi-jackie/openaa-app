"use client";

import { PostManagementList } from "@/components/posts/PostManagementCard";
import type { PostCardView } from "@/features/posts/types";

export function ProfileUserPostsList({ posts }: { posts: PostCardView[] }) {
  return <PostManagementList posts={posts} />;
}
