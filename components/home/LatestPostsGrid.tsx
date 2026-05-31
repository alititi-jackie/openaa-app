import type { PostListItem } from "@/components/posts/PostList";
import { HomePostCard } from "./HomePostCard";

export function LatestPostsGrid({
  posts,
  variant = "grid",
  emptyMessage = "暂无最新内容。",
}: {
  posts: PostListItem[];
  variant?: "grid" | "media" | "news";
  emptyMessage?: string;
}) {
  if (posts.length === 0) {
    return <p className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-500">{emptyMessage}</p>;
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
