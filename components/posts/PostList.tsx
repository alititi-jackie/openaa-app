import Link from "next/link";
import { PostCard, type PostCardData } from "./PostCard";

export type PostListItem = PostCardData;

function listClassName(type?: PostCardData["type"]) {
  if (type === "marketplace") return "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4";
  if (type === "service") return "grid grid-cols-1 gap-4 sm:grid-cols-2";
  return "space-y-4";
}

export function PostList({
  posts,
  compact = false,
  emptyDescription,
  publishHref,
  publishLabel,
}: {
  posts: PostListItem[];
  compact?: boolean;
  emptyDescription?: string;
  publishHref?: string;
  publishLabel?: string;
}) {
  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <p className="font-medium text-gray-900">暂无相关信息</p>
        <p className="mt-2 text-sm text-gray-500">{emptyDescription ?? "可以换个关键词或地区试试，也可以发布第一条信息。"}</p>
        {publishHref ? (
          <Link href={publishHref} className="mt-4 inline-flex rounded-lg bg-[#1976d2] px-4 py-2 text-sm text-white transition hover:bg-[#1565c0]">
            {publishLabel ?? "发布信息"}
          </Link>
        ) : null}
      </div>
    );
  }

  const type = posts[0]?.type;

  return (
    <div className={listClassName(type)}>
      {posts.map((post) => (
        <PostCard key={`${post.href}-${post.title}`} post={post} compact={compact} />
      ))}
    </div>
  );
}
