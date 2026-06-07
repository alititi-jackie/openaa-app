import Link from "next/link";
import { CalendarDays, CircleDollarSign, Info, MapPin } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { ProfileUserPostManagementActions } from "@/components/profile/ProfileUserPostManagementActions";
import { POST_STATUS_LABELS, POST_TYPE_LABELS, POST_TYPE_TO_ROUTE } from "@/features/posts/constants";
import type { PostCardView, PostStatus } from "@/features/posts/types";

const statusStyles: Record<PostStatus, string> = {
  draft: "border-slate-200 bg-slate-100 text-slate-700",
  pending_review: "border-amber-200 bg-amber-50 text-amber-700",
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  hidden: "border-orange-200 bg-orange-50 text-orange-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
  expired: "border-slate-200 bg-slate-100 text-slate-700",
  deleted: "border-red-200 bg-red-50 text-red-700",
};

const editableStatuses = new Set<PostStatus>(["draft", "pending_review", "published", "expired"]);

function FieldIcon({ label }: { label: string }) {
  if (label.includes("区域")) return <MapPin size={14} aria-hidden="true" className="text-slate-400" />;
  if (label.includes("薪资") || label.includes("价格")) return <CircleDollarSign size={14} aria-hidden="true" className="text-slate-400" />;
  return <Info size={14} aria-hidden="true" className="text-slate-400" />;
}

export function ProfileUserPostsList({ posts }: { posts: PostCardView[] }) {
  if (posts.length === 0) {
    return <EmptyState title="暂无发布" description="这里会显示你自己的草稿、待审核、已发布和其它状态信息。" />;
  }

  return (
    <section className="space-y-3">
      {posts.map((post) => {
        const typeLabel = POST_TYPE_LABELS[post.type];
        const extraTag = post.tag && post.tag !== typeLabel ? post.tag : null;

        return (
          <article key={post.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_3px_12px_rgba(15,23,42,0.05)]">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="text-base font-black text-slate-950">{post.title}</h2>
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                {post.status ? <span className={`rounded-full border px-2.5 py-1 ${statusStyles[post.status]}`}>{POST_STATUS_LABELS[post.status]}</span> : null}
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-700">{typeLabel}</span>
                {extraTag ? <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-slate-700">{extraTag}</span> : null}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
              {post.fields.slice(0, 3).map((field) => (
                <span key={`${post.id}-${field.label}`} className="inline-flex items-center gap-1.5">
                  <FieldIcon label={field.label} />
                  <span>
                    {field.label}: {field.value}
                  </span>
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={14} aria-hidden="true" className="text-slate-400" />
                <span>{post.meta}</span>
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-black text-blue-700">
              <Link href={post.href}>查看</Link>
              {post.status && editableStatuses.has(post.status) ? <Link href={`${POST_TYPE_TO_ROUTE[post.type]}/edit/${post.id}`}>编辑</Link> : null}
              <ProfileUserPostManagementActions postId={post.id} status={post.status} />
            </div>
          </article>
        );
      })}
    </section>
  );
}
