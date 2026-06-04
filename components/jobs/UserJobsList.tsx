import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";
import { formatJobDate, getJobModeFromCard } from "@/features/jobs/legacy";
import type { PostCardView, PostStatus } from "@/features/posts/types";
import { UserJobManagementActions } from "./UserJobManagementActions";

const statusStyles: Record<PostStatus, string> = {
  draft: "bg-slate-100 text-slate-600 ring-1 ring-slate-100",
  pending_review: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  published: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  hidden: "bg-zinc-50 text-zinc-600 ring-1 ring-zinc-100",
  rejected: "bg-red-50 text-red-600 ring-1 ring-red-100",
  expired: "bg-slate-100 text-slate-600 ring-1 ring-slate-100",
  deleted: "bg-red-50 text-red-600 ring-1 ring-red-100",
};

function statusLabel(status?: PostStatus) {
  if (status === "deleted") return "已删除";
  if (status === "hidden") return "已隐藏";
  if (status === "pending_review") return "待审核";
  if (status === "draft") return "草稿";
  if (status === "expired") return "已过期";
  if (status === "rejected") return "已拒绝";
  return "显示中";
}

function modeLabel(post: PostCardView) {
  return getJobModeFromCard(post) === "seeking" ? "求职" : "招聘";
}

function modeBadgeClass(post: PostCardView) {
  return getJobModeFromCard(post) === "seeking" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : "bg-blue-50 text-blue-700 ring-1 ring-blue-100";
}

export function UserJobsList({ posts }: { posts: PostCardView[] }) {
  if (posts.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <EmptyState title="你还没有发布招聘信息" description="" />
        <Link href="/jobs/publish" className="mt-4 inline-flex rounded-lg bg-[#1976d2] px-4 py-2 text-sm text-white transition hover:bg-[#1565c0]">
          立即发布
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="line-clamp-2 font-semibold text-gray-900">{post.title}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs ${post.status ? statusStyles[post.status] : "bg-blue-50 text-blue-700 ring-1 ring-blue-100"}`}>
                  {statusLabel(post.status)}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${modeBadgeClass(post)}`}>{modeLabel(post)}</span>
                {post.job?.jobType ? <span className="rounded-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600 ring-1 ring-zinc-100">{post.job.jobType}</span> : null}
              </div>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                <span>💵 {post.job?.salary ?? "薪资电议"}</span>
                {post.job?.workArea || post.location ? <span>📍 {post.job?.workArea ?? post.location}</span> : null}
                <span>🕘 {formatJobDate(post.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {post.status === "published" ? (
              <Link href={post.href} className="rounded-lg bg-white px-3 py-2 text-sm text-zinc-800 ring-1 ring-zinc-300 transition hover:bg-zinc-50">
                查看
              </Link>
            ) : null}
            <Link href={`/jobs/edit/${post.id}`} className="rounded-lg bg-white px-3 py-2 text-sm text-zinc-800 ring-1 ring-zinc-300 transition hover:bg-zinc-50">
              编辑
            </Link>
          </div>

          <UserJobManagementActions postId={post.id} status={post.status} />
        </div>
      ))}
    </div>
  );
}
