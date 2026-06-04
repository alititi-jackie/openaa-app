import Image from "next/image";
import Link from "next/link";
import type { PostCardView } from "@/features/posts/types";
import { getSecondhandModeFromCard, secondhandModeLabel } from "@/features/secondhand/legacy";

export function SecondhandCard({ post }: { post: PostCardView }) {
  const mode = getSecondhandModeFromCard(post);
  const marketplace = post.marketplace;

  return (
    <Link href={post.href} className="block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-square bg-gray-100">
        {post.imageUrl ? (
          <Image src={post.imageUrl} alt={post.title} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-medium text-gray-400">暂无图片</div>
        )}
        {mode === "buying" ? <span className="absolute left-2 top-2 rounded bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">求购</span> : null}
        {marketplace?.isPinned ? <span className="absolute right-2 top-2 rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">置顶</span> : null}
      </div>

      <div className="p-3">
        <p className="text-sm font-bold text-[#1976d2]">{marketplace?.price ?? (mode === "buying" ? "预算面议" : "价格面议")}</p>
        <h2 className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-gray-900">{post.title}</h2>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-medium text-gray-500">
          <span className="rounded bg-gray-100 px-1.5 py-0.5">{secondhandModeLabel(mode)}</span>
          <span className="rounded bg-gray-100 px-1.5 py-0.5">{marketplace?.category || post.tag || "其它二手"}</span>
          <span className="rounded bg-gray-100 px-1.5 py-0.5">{marketplace?.tradeArea || post.location || "纽约 New York"}</span>
        </div>
      </div>
    </Link>
  );
}
