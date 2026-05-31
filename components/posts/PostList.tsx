import { EmptyState } from "@/components/common/EmptyState";
import { PostCard, type PostCardData } from "./PostCard";

export type PostListItem = PostCardData;

export function PostList({ posts, compact = false }: { posts: PostListItem[]; compact?: boolean }) {
  if (posts.length === 0) {
    return <EmptyState title="暂无发布" description="后续接入 Supabase 后，这里会显示真实列表。" />;
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard key={`${post.href}-${post.title}`} post={post} compact={compact} />
      ))}
    </div>
  );
}
