import Link from "next/link";
import type { PostCardView } from "@/features/posts/types";
import { getHousingModeFromCard, housingModeLabel } from "@/features/housing/legacy";

export function HousingCard({ post }: { post: PostCardView }) {
  const mode = getHousingModeFromCard(post);
  const price = post.housing?.price ?? "面议";
  const area = post.housing?.area || post.location || "纽约 New York";
  const roomType = post.housing?.roomType || "房型不限";

  return (
    <Link href={post.href} className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {post.housing?.isPinned ? <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">置顶</span> : null}
            <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">{housingModeLabel(mode)}</span>
          </div>
          <h2 className="mt-2 line-clamp-2 text-base font-bold leading-snug text-slate-950">{post.title}</h2>
        </div>
        <span className="shrink-0 text-xs font-semibold text-slate-500">{post.meta}</span>
      </div>

      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{post.description}</p>

      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
        <span className="rounded-full bg-slate-100 px-2.5 py-1">{price}</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1">{area}</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1">{roomType}</span>
      </div>
    </Link>
  );
}
