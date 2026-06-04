import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";
import { PostEngagementPanel } from "@/components/posts/PostEngagementPanel";
import { getPostEngagementState } from "@/features/posts/engagementQueries";
import type { PostDetailView } from "@/features/posts/types";
import { getSecondhandModeFromCard, secondhandModeLabel } from "@/features/secondhand/legacy";
import { SecondhandContactRevealCard } from "./SecondhandContactRevealCard";

export async function SecondhandDetailLegacyView({ post }: { post: PostDetailView | null }) {
  if (!post) {
    return <EmptyState title="二手信息不存在" description="这条二手信息不存在，或当前不是公开已发布状态。" />;
  }

  const engagement = await getPostEngagementState(post.id);
  const mode = getSecondhandModeFromCard(post);
  const image = post.images[0];

  return (
    <article className="mx-auto max-w-3xl px-4 py-6 pb-24">
      <div className="mb-4">
        <Link href="/secondhand" className="text-sm font-semibold text-blue-700">
          返回列表
        </Link>
      </div>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="relative h-64 bg-zinc-100 md:h-96">
          {image ? (
            <Image src={image.url} alt={image.caption || post.title} fill priority className="object-contain object-center" sizes="768px" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-medium text-gray-400">暂无图片</div>
          )}
          {mode === "buying" ? <span className="absolute left-3 top-3 rounded bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">求购</span> : null}
        </div>

        <div className="p-6">
          <p className="text-2xl font-bold text-[#1976d2]">{post.marketplace?.price ?? (mode === "buying" ? "预算面议" : "价格面议")}</p>
          <h1 className="mt-2 text-xl font-semibold text-gray-900">{post.title}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span className="rounded bg-gray-100 px-2 py-1">{secondhandModeLabel(mode)}</span>
            <span className="rounded bg-gray-100 px-2 py-1">{post.marketplace?.category || post.tag || "其它二手"}</span>
            <span>浏览 {post.viewCount || 0}</span>
            <span>{post.meta}</span>
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4">
            <h2 className="mb-2 font-semibold text-gray-900">商品描述</h2>
            <p className="whitespace-pre-wrap text-sm leading-7 text-gray-600">{post.body}</p>
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4">
            <SecondhandContactRevealCard postId={post.id} />
          </div>

          <div className="mt-4">
            <PostEngagementPanel
              postId={post.id}
              href={post.href}
              title={post.title}
              initialFavoriteCount={post.favoriteCount}
              initialViewCount={post.viewCount}
              initialIsFavorited={engagement.isFavorited}
              initialHasReported={engagement.hasReported}
            />
          </div>
        </div>
      </section>
    </article>
  );
}
