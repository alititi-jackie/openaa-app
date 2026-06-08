"use client";

import { useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";
import { ProfileUserPostManagementActions } from "@/components/profile/ProfileUserPostManagementActions";
import { POST_TYPE_TO_ROUTE } from "@/features/posts/constants";
import { postModeLabel, postModeTone, postStatusLabel, postStatusTone } from "@/features/posts/display";
import { getPostSecondaryTag } from "@/features/posts/accessors";
import type { PostCardView, PostStatus } from "@/features/posts/types";

const editableStatuses = new Set<PostStatus>(["draft", "pending_review", "published", "expired"]);

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function priceText(post: PostCardView) {
  return post.priceDisplay || "";
}

function areaText(post: PostCardView) {
  return post.area || post.location || "";
}

function metaItems(post: PostCardView) {
  const date = formatDate(post.createdAt) || post.meta;
  const price = priceText(post);
  const area = areaText(post);
  const items: string[] = [];

  if (price) items.push(`💵 ${price}`);
  if (area) items.push(`📍 ${area}`);
  if (date) items.push(`🕒 ${date}`);

  return items;
}

export function ProfileUserPostsList({ posts }: { posts: PostCardView[] }) {
  if (posts.length === 0) {
    return <EmptyState title="暂无发布" description="这里会显示你自己的草稿、待审核、显示中和其它状态信息。" />;
  }

  return (
    <section className="space-y-4">
      {posts.map((post) => (
        <ProfileUserPostCard key={post.id} post={post} />
      ))}
    </section>
  );
}

function ProfileUserPostCard({ post }: { post: PostCardView }) {
  const [status, setStatus] = useState<PostStatus | undefined>(post.status);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const mode = postModeLabel(post.type, post.mode, "short");
  const tag = getPostSecondaryTag(post);
  const statusText = postStatusLabel(status);

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="max-w-[260px] truncate text-base font-semibold text-gray-900 sm:max-w-[520px]">{post.title}</h2>
            {status && statusText ? <span className={`rounded-full px-2 py-0.5 text-xs ${postStatusTone(status)}`}>{statusText}</span> : null}
            {mode ? <span className={`rounded-full px-2 py-0.5 text-xs ${postModeTone(post.type, post.mode)}`}>{mode}</span> : null}
            {tag ? <span className="rounded-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600 ring-1 ring-zinc-100">{tag}</span> : null}
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            {metaItems(post).map((item) => (
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
        <ProfileUserPostManagementActions
          postId={post.id}
          postType={post.type}
          status={status}
          onStatusChange={setStatus}
          onMessage={(nextMessage) => setMessage({ ok: nextMessage.ok, text: nextMessage.message })}
        />
      </div>
      {message ? <p className={message.ok ? "mt-2 text-xs font-bold text-emerald-700" : "mt-2 text-xs font-bold text-red-600"}>{message.text}</p> : null}
    </article>
  );
}
