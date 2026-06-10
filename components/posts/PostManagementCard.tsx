"use client";

import { useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";
import { getPostSecondaryTag } from "@/features/posts/accessors";
import { POST_TYPE_LABELS, POST_TYPE_TO_ROUTE } from "@/features/posts/constants";
import {
  formatLocationLabel,
  formatPostModeLabel,
  formatPostStatusLabel,
  formatPostTime,
  formatViewCount,
  postModeTone,
  postStatusTone,
} from "@/features/posts/display";
import type { PostCardView, PostStatus } from "@/features/posts/types";
import { UserPostManagementActions } from "./UserPostManagementActions";

const editableStatuses = new Set<PostStatus>(["draft", "pending_review", "published", "expired"]);

type PostManagementCardProps = {
  post: PostCardView;
  showTypeLabel?: boolean;
  onStatusChange?: (status: PostStatus) => void;
  onDeleted?: () => void;
};

export function PostManagementList({
  posts,
  note,
  showTypeLabel = false,
}: {
  posts: PostCardView[];
  note?: string;
  showTypeLabel?: boolean;
}) {
  const [visibleItems, setVisibleItems] = useState(posts);

  function patchStatus(postId: string, status: PostStatus) {
    setVisibleItems((current) => current.map((post) => (post.id === postId ? { ...post, status } : post)));
  }

  function removePost(postId: string) {
    setVisibleItems((current) => current.filter((post) => post.id !== postId));
  }

  if (visibleItems.length === 0) {
    return <EmptyState title="暂无发布" description="这里会显示你自己的草稿、待审核、显示中和其它状态信息。" />;
  }

  return (
    <section className="space-y-4">
      {note ? <p className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">{note}</p> : null}
      {visibleItems.map((post) => (
        <PostManagementCard
          key={post.id}
          post={post}
          showTypeLabel={showTypeLabel}
          onStatusChange={(status) => patchStatus(post.id, status)}
          onDeleted={() => removePost(post.id)}
        />
      ))}
    </section>
  );
}

export function PostManagementCard({ post, showTypeLabel = false, onStatusChange, onDeleted }: PostManagementCardProps) {
  const [status, setStatus] = useState<PostStatus | undefined>(post.status);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const mode = formatPostModeLabel(post.type, post.mode, "short");
  const tag = getPostSecondaryTag(post);
  const statusText = formatPostStatusLabel(status);

  function updateStatus(nextStatus: PostStatus) {
    setStatus(nextStatus);
    onStatusChange?.(nextStatus);
  }

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {showTypeLabel ? <p className="mb-1 text-xs font-bold text-blue-700">{POST_TYPE_LABELS[post.type]}</p> : null}
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="max-w-[260px] truncate text-base font-semibold text-gray-900 sm:max-w-[520px]">{post.title}</h2>
            {status && statusText ? <span className={`rounded-full px-2 py-0.5 text-xs ${postStatusTone(status)}`}>{statusText}</span> : null}
            {mode ? <span className={`rounded-full px-2 py-0.5 text-xs ${postModeTone(post.type, post.mode)}`}>{mode}</span> : null}
            {tag ? <span className="rounded-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600 ring-1 ring-zinc-100">{tag}</span> : null}
          </div>

          {post.description ? <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">{post.description}</p> : null}

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            {managementMetaItems(post).map((item) => (
              <span key={`${post.id}-${item}`}>{item}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link href={post.href} className="rounded-lg bg-white px-3 py-2 text-center text-sm text-zinc-800 ring-1 ring-zinc-300 transition hover:bg-zinc-50">
          查看
        </Link>
        {status && editableStatuses.has(status) ? (
          <Link href={`${POST_TYPE_TO_ROUTE[post.type]}/edit/${post.id}`} className="rounded-lg bg-white px-3 py-2 text-center text-sm text-zinc-800 ring-1 ring-zinc-300 transition hover:bg-zinc-50">
            编辑
          </Link>
        ) : null}
        <UserPostManagementActions
          postId={post.id}
          postType={post.type}
          status={status}
          onStatusChange={updateStatus}
          onDeleted={onDeleted}
          onMessage={(nextMessage) => setMessage({ ok: nextMessage.ok, text: nextMessage.message })}
        />
      </div>
      {message ? <p className={message.ok ? "mt-2 text-xs font-bold text-emerald-700" : "mt-2 text-xs font-bold text-red-600"}>{message.text}</p> : null}
    </article>
  );
}

function managementMetaItems(post: PostCardView) {
  const items: string[] = [];
  const price = post.priceDisplay || "";
  const area = formatLocationLabel(post.area || post.location);
  const time = formatPostTime(post.publishedAt || post.createdAt, "date");

  if (price) items.push(`💵 ${price}`);
  if (area) items.push(`📍 ${area}`);
  items.push(formatViewCount(post.viewCount, { icon: true }));
  if (time) items.push(`🕒 ${time}`);

  return items;
}
