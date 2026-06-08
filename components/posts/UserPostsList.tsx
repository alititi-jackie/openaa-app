"use client";

import { useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";
import { UserPostManagementActions } from "@/components/posts/UserPostManagementActions";
import { POST_STATUS_LABELS, POST_TYPE_LABELS, POST_TYPE_TO_ROUTE } from "@/features/posts/constants";
import type { PostCardView, PostStatus } from "@/features/posts/types";

const statusStyles: Record<PostStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  pending_review: "bg-amber-50 text-amber-700",
  published: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  hidden: "bg-zinc-50 text-zinc-600 ring-1 ring-zinc-100",
  rejected: "bg-red-50 text-red-700",
  expired: "bg-slate-100 text-slate-600",
  deleted: "bg-red-50 text-red-700",
};

const editableStatuses = new Set<PostStatus>(["draft", "pending_review", "published", "expired"]);

function profileStatusLabel(status?: PostStatus) {
  if (status === "published") return "显示中";
  if (status === "hidden") return "已隐藏";
  return status ? POST_STATUS_LABELS[status] : "状态";
}

export function UserPostsList({ posts, note }: { posts: PostCardView[]; note?: string }) {
  if (posts.length === 0) {
    return <EmptyState title="暂无发布" description="这里会显示你自己的草稿、待审核、已发布和其它状态信息。" />;
  }

  return (
    <section className="space-y-3">
      {note ? <p className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">{note}</p> : null}
      {posts.map((post) => (
        <UserPostListItem key={post.id} post={post} />
      ))}
    </section>
  );
}

function UserPostListItem({ post }: { post: PostCardView }) {
  const [status, setStatus] = useState<PostStatus | undefined>(post.status);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
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
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status ? statusStyles[status] : "bg-slate-100 text-slate-600"}`}>
          {profileStatusLabel(status)}
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {status && editableStatuses.has(status) ? (
            <Link href={`${POST_TYPE_TO_ROUTE[post.type]}/edit/${post.id}`} className="text-sm font-black text-blue-700">
              编辑
            </Link>
          ) : null}
          {status === "published" ? (
            <Link href={post.href} className="text-sm font-black text-blue-700">
              查看
            </Link>
          ) : null}
        </div>
      </div>
      <UserPostManagementActions
        postId={post.id}
        postType={post.type}
        status={status}
        onStatusChange={(nextStatus) => {
          setStatus(nextStatus);
        }}
        onMessage={(nextMessage) => {
          setMessage({ ok: nextMessage.ok, text: nextMessage.message });
        }}
      />
      {message ? <p className={message.ok ? "mt-2 text-xs font-bold text-emerald-700" : "mt-2 text-xs font-bold text-red-600"}>{message.text}</p> : null}
    </div>
  );
}
