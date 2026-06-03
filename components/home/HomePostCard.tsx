import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import type { PostListItem } from "@/components/posts/PostList";

export function HomePostCard({ post, variant = "grid" }: { post: PostListItem; variant?: "grid" | "media" | "news" }) {
  if (variant === "media") {
    return (
      <Link
        href={post.href}
        className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_1px_10px_rgba(15,23,42,0.06)] transition active:scale-[0.99]"
      >
        <Thumb post={post} />
        <span className="min-w-0 flex-1">
          <Title post={post} />
          <MetaLine post={post} />
          <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-500">{post.description}</span>
        </span>
      </Link>
    );
  }

  if (variant === "news") {
    const rank = Number(post.meta);
    return (
      <Link
        href={post.href}
        className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.06)] transition active:scale-[0.99]"
      >
        <span className={`mt-0.5 w-6 shrink-0 text-center text-xs font-black tabular-nums ${rankClassName(rank)}`}>
          {post.meta}
        </span>
        <span className="min-w-0 flex-1">
          <span className="mb-1.5 flex flex-wrap items-center gap-2">
            {post.tag ? <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">{post.tag}</span> : null}
            {post.fields?.[0]?.value ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">{post.fields[0].value}</span> : null}
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-400">
              <Clock size={10} aria-hidden="true" />
              {post.location || "最新"}
            </span>
          </span>
          <Title post={post} />
          <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-500">{post.description}</span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={post.href}
      className="flex min-h-[96px] flex-col rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-[0_1px_6px_rgba(15,23,42,0.06)] transition active:scale-[0.98]"
    >
      <Title post={post} />
      <MetaLine post={post} />
      <FieldLine post={post} />
    </Link>
  );
}

function Thumb({ post }: { post: PostListItem }) {
  return (
    <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
      {post.imageUrl ? <Image src={post.imageUrl} alt={post.title} fill sizes="64px" className="object-cover" /> : <span className="absolute inset-0 bg-gradient-to-br from-blue-50 to-slate-100" />}
    </span>
  );
}

function Title({ post }: { post: PostListItem }) {
  return <span className="line-clamp-2 text-sm font-black leading-snug text-slate-950">{post.title}</span>;
}

function MetaLine({ post }: { post: PostListItem }) {
  return (
    <span className="mt-2 flex min-h-4 items-center gap-1 text-[11px] font-semibold text-slate-500">
      {post.location ? (
        <>
          <MapPin size={11} aria-hidden="true" />
          <span className="truncate">{post.location}</span>
        </>
      ) : (
        <span>{post.meta}</span>
      )}
    </span>
  );
}

function rankClassName(rank: number) {
  if (rank === 1) return "text-rose-500";
  if (rank === 2) return "text-orange-400";
  if (rank === 3) return "text-amber-400";
  return "text-slate-300";
}

function FieldLine({ post }: { post: PostListItem }) {
  const field = post.fields?.[0];
  const second = post.fields?.[1];

  if (!field && !post.tag) {
    return <span className="mt-auto pt-3 text-[11px] font-semibold text-slate-400">{post.meta}</span>;
  }

  return (
    <span className="mt-auto flex min-w-0 items-center gap-1.5 pt-3 text-[11px] font-bold text-slate-500">
      {post.tag ? <span className="truncate rounded-full bg-slate-50 px-2 py-1">{post.tag}</span> : null}
      {field ? <span className="truncate rounded-full bg-blue-50 px-2 py-1 text-blue-700">{field.value}</span> : null}
      {second ? <span className="truncate rounded-full bg-slate-50 px-2 py-1">{second.value}</span> : null}
    </span>
  );
}
