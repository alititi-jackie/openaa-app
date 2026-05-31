import { EmptyState } from "@/components/common/EmptyState";
import { PostCard, type PostCardData } from "./PostCard";

export type PostListItem = PostCardData;

export function PostList({ posts, compact = false, emptyDescription }: { posts: PostListItem[]; compact?: boolean; emptyDescription?: string }) {
  if (posts.length === 0) {
    return <EmptyState title="暂无发布" description={emptyDescription ?? "暂时没有符合条件的公开内容。"} />;
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard key={`${post.href}-${post.title}`} post={post} compact={compact} />
      ))}
    </div>
  );
}
