import Image from "next/image";
import Link from "next/link";
import { Pin } from "lucide-react";
import { formatNewsDate } from "@/features/news/mappers";
import type { NewsPostCard } from "@/features/news/types";

export function NewsCard({ post, featured = false }: { post: NewsPostCard; featured?: boolean }) {
  if (featured) {
    return (
      <Link href={post.href} className="block overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <Cover post={post} className="h-44 w-full" sizes="(max-width: 560px) 100vw, 560px" />
        <span className="block p-4">
          <Meta post={post} />
          <span className="mt-1 block line-clamp-2 text-lg font-black leading-snug text-slate-950">{post.title}</span>
          <span className="mt-2 block line-clamp-2 text-sm leading-6 text-slate-600">{post.excerpt}</span>
          <span className="mt-2 block text-xs font-semibold text-slate-400">{formatNewsDate(post.publishedAt)}</span>
        </span>
      </Link>
    );
  }

  return (
    <Link href={post.href} className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
      <Cover post={post} className="h-24 w-28 shrink-0 rounded-xl" sizes="112px" />
      <span className="min-w-0 flex-1">
        <Meta post={post} />
        <span className="mt-1 block line-clamp-2 text-sm font-black leading-snug text-slate-950">{post.title}</span>
        <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-600">{post.excerpt}</span>
        <span className="mt-2 block text-xs font-semibold text-slate-400">{formatNewsDate(post.publishedAt)}</span>
      </span>
    </Link>
  );
}

function Cover({ post, className, sizes }: { post: NewsPostCard; className: string; sizes: string }) {
  return (
    <span className={`relative block overflow-hidden bg-slate-100 ${className}`}>
      {post.coverImageUrl ? (
        <Image src={post.coverImageUrl} alt={post.title} fill sizes={sizes} className="object-cover" />
      ) : (
        <span className="absolute inset-0 bg-gradient-to-br from-blue-50 via-slate-100 to-cyan-50" />
      )}
    </span>
  );
}

function Meta({ post }: { post: NewsPostCard }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold text-blue-700">{post.categoryName}</span>
      {post.isPinned ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
          <Pin size={12} aria-hidden="true" />
          置顶
        </span>
      ) : null}
    </span>
  );
}
