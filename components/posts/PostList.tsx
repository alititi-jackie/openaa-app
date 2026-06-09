import { EmptyState } from "@/components/common/EmptyState";
import { PostCard, type PostCardData, type PostCardVariant } from "./PostCard";

export type PostListItem = PostCardData;

export function PostList({ posts, compact = false, emptyDescription, cardVariant = "default" }: { posts: PostListItem[]; compact?: boolean; emptyDescription?: string; cardVariant?: PostCardVariant }) {
  if (posts.length === 0) {
    return <EmptyState title="暂无发布" description={emptyDescription ?? "暂时没有符合条件的公开内容。"} />;
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard key={`${post.href}-${post.title}`} post={post} compact={compact} variant={cardVariant} />
      ))}
    </div>
  );
}
