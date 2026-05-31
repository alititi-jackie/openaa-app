import Link from "next/link";
import Image from "next/image";
import { Eye, Heart } from "lucide-react";

export type PostCardData = {
  id?: string;
  title: string;
  description: string;
  href: string;
  meta: string;
  tag?: string;
  location?: string;
  authorName?: string;
  imageUrl?: string;
  favoriteCount?: number;
  viewCount?: number;
  fields?: Array<{ label: string; value: string }>;
};

export function PostCard({ post, compact = false }: { post: PostCardData; compact?: boolean }) {
  return (
    <Link href={post.href} className="block rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        {post.imageUrl ? (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
            <Image src={post.imageUrl} alt={post.title} fill sizes="80px" className="object-cover" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {post.tag ? <p className="mb-1 text-xs font-bold text-blue-700">{post.tag}</p> : null}
              <h3 className="line-clamp-2 font-black leading-snug text-slate-950">{post.title}</h3>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{post.meta}</span>
          </div>
          {!compact ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{post.description}</p> : null}
          {post.fields?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.fields.slice(0, compact ? 2 : 4).map((field) => (
                <span key={`${field.label}-${field.value}`} className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
                  {field.label}: {field.value}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
            {post.location ? <span>{post.location}</span> : null}
            {post.authorName ? <span>{post.authorName}</span> : null}
            <span className="inline-flex items-center gap-1">
              <Eye size={13} aria-hidden="true" />
              {post.viewCount ?? 0}
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart size={13} aria-hidden="true" />
              {post.favoriteCount ?? 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
