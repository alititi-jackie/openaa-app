import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";
import { POST_STATUS_LABELS } from "@/features/posts/constants";
import type { PostCardView, PostStatus } from "@/features/posts/types";
import { getSecondhandModeFromCard, secondhandModeLabel } from "@/features/secondhand/legacy";
import { UserSecondhandManagementActions } from "./UserSecondhandManagementActions";

const statusStyles: Record<PostStatus, string> = {
  draft: "bg-zinc-50 text-zinc-600 ring-1 ring-zinc-100",
  pending_review: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  published: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  hidden: "bg-zinc-50 text-zinc-600 ring-1 ring-zinc-100",
  rejected: "bg-red-50 text-red-600 ring-1 ring-red-100",
  expired: "bg-zinc-50 text-zinc-600 ring-1 ring-zinc-100",
  deleted: "bg-red-50 text-red-600 ring-1 ring-red-100",
};

const editableStatuses = new Set<PostStatus>(["draft", "pending_review", "published", "hidden", "expired"]);

export function UserSecondhandList({ posts }: { posts: PostCardView[] }) {
  if (posts.length === 0) {
    return <EmptyState title="你还没有发布商品" description="发布二手商品或求购信息后，会在这里统一管理。" />;
  }

  return (
    <section className="space-y-4">
      {posts.map((post) => {
        const mode = getSecondhandModeFromCard(post);
        return (
          <div key={post.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="line-clamp-2 font-semibold text-gray-900">{post.title}</h2>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${post.status ? statusStyles[post.status] : "bg-zinc-50 text-zinc-600 ring-1 ring-zinc-100"}`}>
                    {post.status ? POST_STATUS_LABELS[post.status] : "状态"}
                  </span>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700 ring-1 ring-amber-100">{secondhandModeLabel(mode)}</span>
                  <span className="rounded-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600 ring-1 ring-zinc-100">{post.marketplace?.category || "其它二手"}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                  <span>{post.marketplace?.price ?? "价格面议"}</span>
                  <span>{post.marketplace?.tradeArea || post.location || "纽约 New York"}</span>
                  <span>{post.meta}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {post.status === "published" ? (
                <Link href={post.href} className="rounded-lg bg-white px-3 py-2 text-sm text-zinc-800 ring-1 ring-zinc-300 transition hover:bg-zinc-50">
                  查看
                </Link>
              ) : null}
              {post.status && editableStatuses.has(post.status) ? (
                <Link href={`/secondhand/edit/${post.id}`} className="rounded-lg bg-white px-3 py-2 text-sm text-zinc-800 ring-1 ring-zinc-300 transition hover:bg-zinc-50">
                  编辑
                </Link>
              ) : null}
            </div>

            <UserSecondhandManagementActions postId={post.id} status={post.status} />
          </div>
        );
      })}
    </section>
  );
}
