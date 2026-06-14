import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
import type { PostListItem } from "@/components/posts/PostList";
import { DetailMetaPills, type DetailMetaPill } from "@/components/posts/DetailMetaPills";

export function HomePostCard({ post, variant = "grid" }: { post: PostListItem; variant?: "grid" | "media" | "news" }) {
  if (variant === "media") {
    return (
      <Link
        href={post.href}
        className="flex h-[104px] min-w-0 gap-3 overflow-hidden rounded-xl border border-slate-100 bg-white p-3 shadow-[0_1px_10px_rgba(15,23,42,0.06)] transition active:scale-[0.99]"
      >
        <Thumb post={post} />
        <div className="grid min-w-0 flex-1 grid-rows-[20px_20px_28px] content-between overflow-hidden">
          <Title post={post} />
          <Summary post={post} />
          <HomePillLine post={post} />
        </div>
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
        <span className="min-w-0 flex-1">
          <span className="mb-1.5 flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap">
            <span className={`mt-0.5 w-6 shrink-0 text-center text-xs font-black tabular-nums ${rankClassName(rank)}`}>
              {post.meta}
            </span>
            {post.tag ? <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">{post.tag}</span> : null}
            {post.fields?.[0]?.value ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">{post.fields[0].value}</span> : null}
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-400">
              <Clock size={10} aria-hidden="true" />
              {post.location || "最新"}
            </span>
          </span>
          <Title post={post} />
          <span
            className="mt-1 text-xs leading-5 text-slate-500"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              maxHeight: "3.75rem",
              overflow: "hidden",
            }}
          >
            {post.description}
          </span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={post.href}
      className="grid h-[104px] min-w-0 grid-rows-[20px_20px_28px] content-between overflow-hidden rounded-xl border border-slate-100 bg-white px-3 py-3 shadow-[0_1px_6px_rgba(15,23,42,0.06)] transition active:scale-[0.98]"
    >
      <Title post={post} />
      <Summary post={post} />
      <HomePillLine post={post} />
    </Link>
  );
}

function Thumb({ post }: { post: PostListItem }) {
  return (
    <span className="relative h-full w-28 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:w-32">
      {post.imageUrl ? <Image src={post.imageUrl} alt={post.title} fill sizes="(min-width: 640px) 128px, 112px" className="object-cover" /> : <span className="absolute inset-0 bg-gradient-to-br from-blue-50 to-slate-100" />}
    </span>
  );
}

function Title({ post, lines = 1 }: { post: PostListItem; lines?: 1 | 2 }) {
  return (
    <span className={`block min-w-0 text-sm font-black leading-5 text-slate-950 ${lines === 1 ? "truncate" : "line-clamp-2"}`}>
      {post.title}
    </span>
  );
}

function Summary({ post }: { post: PostListItem }) {
  return <span className="block min-w-0 truncate text-xs leading-5 text-slate-500">{post.description}</span>;
}

function rankClassName(rank: number) {
  if (rank === 1) return "text-rose-500";
  if (rank === 2) return "text-orange-400";
  if (rank === 3) return "text-amber-400";
  return "text-slate-300";
}

function homePillItems(post: PostListItem): DetailMetaPill[] {
  const items = post.listingMetaFields ?? post.detailMetaFields ?? [];
  const businessItems = items.filter((item) => item.group === "business");

  if (post.type === "service") {
    const commonItems = items.filter((item) => item.group === "common");
    return [...businessItems, ...commonItems].map((item) => ({ ...item, group: undefined }));
  }

  return businessItems.map((item) => ({ ...item, group: undefined }));
}

function HomePillLine({ post }: { post: PostListItem }) {
  const items = homePillItems(post);

  return (
    <div className="min-h-0 min-w-0 overflow-hidden pt-1">
      <DetailMetaPills
        items={items}
        postId={post.id ?? post.href}
        initialViewCount={post.viewCount ?? 0}
        trackViews={false}
        oneLine
        className="!mt-0 !max-w-full !gap-1.5 [&>span]:!shrink-0 [&>span]:!whitespace-nowrap [&>span]:!px-2 [&>span]:!py-0.5 [&>span]:!text-[11px] [&>span]:!leading-5"
      />
    </div>
  );
}
