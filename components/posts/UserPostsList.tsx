import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";
import { UserPostManagementActions } from "@/components/posts/UserPostManagementActions";
import { POST_STATUS_LABELS, POST_TYPE_LABELS, POST_TYPE_TO_ROUTE } from "@/features/posts/constants";
import type { PostCardView, PostStatus } from "@/features/posts/types";

const statusStyles: Record<PostStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  pending_review: "bg-amber-50 text-amber-700",
  published: "bg-emerald-50 text-emerald-700",
  hidden: "bg-orange-50 text-orange-700",
  rejected: "bg-red-50 text-red-700",
  expired: "bg-slate-100 text-slate-600",
  deleted: "bg-red-50 text-red-700",
};

const editableStatuses = new Set<PostStatus>(["draft", "pending_review", "published", "expired"]);

export function UserPostsList({ posts, note }: { posts: PostCardView[]; note?: string }) {
  if (posts.length === 0) {
    return <EmptyState title="暂无发布" description="这里会显示你自己的草稿、待审核、已发布和其它状态信息。" />;
  }

  return (
    <section className="space-y-3">
      {note ? <p className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">{note}</p> : null}
      {posts.map((post) => (
        <div key={post.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-blue-700">{POST_TYPE_LABELS[post.type]}</p>
          <h2 className="mt-1 font-black text-slate-950">{post.title}</h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{post.description}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
            {post.fields.slice(0, 3).map((field) => (
              <span key={`${post.id}-${field.label}`} className="rounded-full bg-slate-100 px-2.5 py-1">
                {field.label}: {field.value}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${post.status ? statusStyles[post.status] : "bg-slate-100 text-slate-600"}`}>
              {post.status ? POST_STATUS_LABELS[post.status] : "状态"}
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {post.status && editableStatuses.has(post.status) ? (
                <Link href={`${POST_TYPE_TO_ROUTE[post.type]}/edit/${post.id}`} className="text-sm font-black text-blue-700">
                  编辑
                </Link>
              ) : null}
              {post.status === "published" ? (
                <Link href={post.href} className="text-sm font-black text-blue-700">
                  查看公开页
                </Link>
              ) : null}
            </div>
          </div>
          <UserPostManagementActions postId={post.id} status={post.status} />
        </div>
      ))}
    </section>
  );
}
