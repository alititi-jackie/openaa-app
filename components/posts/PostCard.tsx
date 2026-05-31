import Link from "next/link";

export type PostCardData = {
  title: string;
  description: string;
  href: string;
  meta: string;
  tag?: string;
};

export function PostCard({ post, compact = false }: { post: PostCardData; compact?: boolean }) {
  return (
    <Link href={post.href} className="block rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {post.tag ? <p className="mb-1 text-xs font-bold text-blue-700">{post.tag}</p> : null}
          <h3 className="line-clamp-2 font-black leading-snug text-slate-950">{post.title}</h3>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{post.meta}</span>
      </div>
      {!compact ? <p className="mt-2 text-sm leading-6 text-slate-600">{post.description}</p> : null}
    </Link>
  );
}
