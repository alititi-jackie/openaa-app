import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Share2 } from "lucide-react";
import { formatNewsDate } from "@/features/news/mappers";
import type { NewsPostDetail } from "@/features/news/types";

export function NewsDetail({ post }: { post: NewsPostDetail }) {
  const paragraphs = post.body.split(/\n+/).map((part) => part.trim()).filter(Boolean);

  return (
    <article className="space-y-4">
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <Link href="/news" className="inline-flex items-center gap-1 text-sm font-bold text-slate-600">
          <ArrowLeft size={16} aria-hidden="true" />
          返回新闻列表
        </Link>
        <p className="mt-4 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{post.categoryName}</p>
        <h1 className="mt-3 text-2xl font-black leading-tight text-slate-950">{post.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
          <span className="rounded-full bg-slate-100 px-2.5 py-1">发布时间：{formatNewsDate(post.publishedAt)}</span>
          {post.isPinned ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">置顶</span> : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-100 shadow-sm">
        <div className="relative aspect-[16/9]">
          {post.coverImageUrl ? (
            <Image src={post.coverImageUrl} alt={post.title} fill sizes="(max-width: 560px) 100vw, 760px" className="object-cover" priority />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-slate-100 to-cyan-50" />
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="space-y-4 text-[15px] leading-7 text-slate-800">
          {paragraphs.map((paragraph, index) => (
            <p key={`${post.id}-${index}`}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2">
        <button type="button" className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl bg-slate-950 text-sm font-black text-white">
          <Share2 size={16} aria-hidden="true" />
          分享
        </button>
        <Link href="/news" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-700">
          返回列表
        </Link>
      </section>
    </article>
  );
}
