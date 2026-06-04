import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";
import { POST_STATUS_LABELS } from "@/features/posts/constants";
import type { PostCardView, PostStatus } from "@/features/posts/types";
import { getHousingModeFromCard, housingModeLabel } from "@/features/housing/legacy";
import { UserHousingManagementActions } from "./UserHousingManagementActions";

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

export function UserHousingList({ posts }: { posts: PostCardView[] }) {
  if (posts.length === 0) {
    return <EmptyState title="你还没有发布房屋信息" description="发布房源或求租信息后，会在这里统一管理。" />;
  }

  return (
    <section className="space-y-3">
      {posts.map((post) => {
        const mode = getHousingModeFromCard(post);
        return (
          <div key={post.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">{housingModeLabel(mode)}</span>
                <h2 className="mt-2 line-clamp-2 font-black text-slate-950">{post.title}</h2>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${post.status ? statusStyles[post.status] : "bg-slate-100 text-slate-600"}`}>
                {post.status ? POST_STATUS_LABELS[post.status] : "状态"}
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{post.description}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
              <span className="rounded-full bg-slate-100 px-2.5 py-1">{post.housing?.price ?? "面议"}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1">{post.housing?.area || post.location || "纽约 New York"}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1">{post.housing?.roomType || "房型不限"}</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {post.status === "published" ? (
                <Link href={post.href} className="text-sm font-black text-blue-700">
                  查看
                </Link>
              ) : null}
              {post.status && editableStatuses.has(post.status) ? (
                <Link href={`/housing/edit/${post.id}`} className="text-sm font-black text-blue-700">
                  编辑
                </Link>
              ) : null}
            </div>
            <UserHousingManagementActions postId={post.id} status={post.status} />
          </div>
        );
      })}
    </section>
  );
}
