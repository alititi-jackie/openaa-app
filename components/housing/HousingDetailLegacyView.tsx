import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";
import { getPostEngagementState } from "@/features/posts/engagementQueries";
import type { PostDetailView } from "@/features/posts/types";
import { getHousingModeFromCard, housingModeLabel } from "@/features/housing/legacy";
import { PostEngagementPanel } from "@/components/posts/PostEngagementPanel";
import { HousingContactRevealCard } from "./HousingContactRevealCard";

export async function HousingDetailLegacyView({ post }: { post: PostDetailView | null }) {
  if (!post) {
    return <EmptyState title="房屋信息不存在" description="这条房屋信息不存在，或当前不是公开已发布状态。" />;
  }

  const engagement = await getPostEngagementState(post.id);
  const mode = getHousingModeFromCard(post);
  const summary = [housingModeLabel(mode), post.housing?.area || post.location, post.housing?.price].filter(Boolean).join(" · ");

  return (
    <article className="mx-auto max-w-3xl space-y-4 px-4 py-5">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="rounded bg-blue-50 px-2 py-0.5 text-blue-700">{housingModeLabel(mode)}</span>
          {post.housing?.isPinned ? <span className="rounded bg-red-50 px-2 py-0.5 text-red-600">置顶</span> : null}
        </div>
        <h1 className="mt-2 text-2xl font-black leading-tight text-slate-950">{post.title}</h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">{summary}</p>
      </section>

      {post.images.length > 0 ? (
        <section className="space-y-3">
          {post.images.map((image) => (
            <div key={image.url} className="relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm">
              <Image src={image.url} alt={image.caption || post.title} fill sizes="768px" className="object-cover" />
            </div>
          ))}
        </section>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">房屋描述</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{post.body}</p>
        <dl className="mt-4 grid gap-2">
          <DetailRow label="类型" value={housingModeLabel(mode)} />
          <DetailRow label="租金" value={post.housing?.price} />
          <DetailRow label="地区" value={post.housing?.area || post.location} />
          <DetailRow label="房型" value={post.housing?.roomType} />
        </dl>
      </section>

      <PostEngagementPanel
        postId={post.id}
        href={post.href}
        title={post.title}
        initialFavoriteCount={post.favoriteCount}
        initialViewCount={post.viewCount}
        initialIsFavorited={engagement.isFavorited}
        initialHasReported={engagement.hasReported}
      />

      <HousingContactRevealCard postId={post.id} />

      <Link href="/housing" className="block rounded-lg bg-slate-100 px-4 py-3 text-center text-sm font-black text-slate-700">
        返回列表
      </Link>
    </article>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;

  return (
    <div className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
      <dt className="shrink-0 font-bold text-slate-700">{label}</dt>
      <dd className="min-w-0 truncate text-right text-slate-900">{value}</dd>
    </div>
  );
}
