"use client";

import { PostManagementList } from "./PostManagementCard";
import type { PostCardView } from "@/features/posts/types";

export function UserPostsList({ posts, note }: { posts: PostCardView[]; note?: string }) {
  return <PostManagementList posts={posts} note={note} showTypeLabel />;
}
