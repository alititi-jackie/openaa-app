import Link from "next/link";
import { Pin } from "lucide-react";
import { formatNewsDate } from "@/features/news/mappers";
import type { NewsPostCard } from "@/features/news/types";
import { NewsCover } from "./NewsCover";

export function NewsCard({ post, featured = false }: { post: NewsPostCard; featured?: boolean }) {
  if (featured) {
    return (
      <Link href={post.href} className="block overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <NewsCover src={post.coverImageUrl} alt={post.title} className="h-48 w-full" sizes="(max-width: 560px) 100vw, 560px" priority />
        <span className="block p-4">
          <Meta post={post} />
          <span className="mt-1 block line-clamp-2 text-lg font-bold leading-snug text-slate-950">{post.title}</span>
          <span className="mt-2 block line-clamp-2 text-sm leading-6 text-slate-600">{post.excerpt}</span>
        </span>
      </Link>
    );
  }

  return (
    <Link href={post.href} className="flex min-h-30 gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
      <NewsCover src={post.coverImageUrl} alt={post.title} className="h-24 w-32 shrink-0 rounded-xl" sizes="128px" />
      <span className="flex min-w-0 flex-1 flex-col">
        <Meta post={post} />
        <span className="mt-1 block line-clamp-2 text-sm font-semibold leading-snug text-slate-950">{post.title}</span>
        <span className="mt-1 block line-clamp-1 text-xs leading-5 text-slate-600">{post.excerpt}</span>
      </span>
    </Link>
  );
}

function Meta({ post }: { post: NewsPostCard }) {
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span className="font-medium text-blue-600">{post.categoryName}</span>
      <span className="text-slate-300">·</span>
      <span className="font-normal text-slate-400">{formatNewsDate(post.publishedAt)}</span>
      {post.isPinned ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
          <Pin size={12} aria-hidden="true" />
          置顶
        </span>
      ) : null}
    </span>
  );
}
