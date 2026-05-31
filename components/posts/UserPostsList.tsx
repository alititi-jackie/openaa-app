import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";
import { POST_STATUS_LABELS, POST_TYPE_LABELS } from "@/features/posts/constants";
import type { PostCardView } from "@/features/posts/types";

export function UserPostsList({ posts, note }: { posts: PostCardView[]; note?: string }) {
  if (posts.length === 0) {
    return <EmptyState title="暂无发布" description="这里会显示你自己的草稿、待审核、已发布和其他状态信息。" />;
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
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
              {post.status ? POST_STATUS_LABELS[post.status] : "状态"}
            </span>
            {post.status === "published" ? (
              <Link href={post.href} className="text-sm font-black text-blue-700">
                查看公开页
              </Link>
            ) : (
              <span className="text-sm font-black text-slate-500">编辑/发布管理后续开放</span>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
