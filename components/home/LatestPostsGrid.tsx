import { EmptyState } from "@/components/common/EmptyState";
import type { PostListItem } from "@/components/posts/PostList";
import { HomePostCard } from "./HomePostCard";

export function LatestPostsGrid({
  posts,
  variant = "grid",
}: {
  posts: PostListItem[];
  variant?: "grid" | "media" | "news";
}) {
  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5">
        <EmptyState title="暂无内容" description="这里会在接入公开数据后显示最新发布。" />
      </div>
    );
  }

  if (variant === "media" || variant === "news") {
    return (
      <div className="space-y-2">
        {posts.map((post, index) => (
          <HomePostCard key={`${post.href}-${post.title}`} post={variant === "news" ? { ...post, meta: String(index + 1).padStart(2, "0") } : post} variant={variant} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {posts.map((post) => (
        <HomePostCard key={`${post.href}-${post.title}`} post={post} />
      ))}
    </div>
  );
}
