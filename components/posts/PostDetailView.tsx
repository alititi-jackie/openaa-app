import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";
import { getPostEngagementState } from "@/features/posts/engagementQueries";
import type { PostCardView as PostCardViewData, PostDetailView as PostDetailViewData } from "@/features/posts/types";
import { DetailImageCarousel } from "./DetailImageCarousel";
import { DetailMetaPills } from "./DetailMetaPills";
import { PostDisplayBody } from "./PostDisplayBody";
import { ContactRevealCard } from "./ContactRevealCard";
import { DetailActionBar } from "./DetailActionBar";
import { DetailSafetyNotice } from "./DetailSafetyNotice";
import { DetailShareCard } from "./DetailShareCard";

function listHref(post: PostDetailViewData) {
  return post.href.replace(`/${post.id}`, "");
}

function shareText(post: PostDetailViewData) {
  return [post.tag, post.location, post.description].filter(Boolean).join(" · ");
}

function recommendationMeta(post: PostCardViewData) {
  return [post.tag, post.categoryValue, post.area || post.location, post.priceDisplay].filter(Boolean).slice(0, 4);
}

function DetailRecommendationCard({ post, prefix }: { post: PostCardViewData; prefix?: string }) {
  const meta = recommendationMeta(post);

  return (
    <Link href={post.href} className="block rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 transition hover:bg-slate-100">
      <div className="flex min-w-0 gap-3">
        {post.imageUrl ? (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
            <Image src={post.imageUrl} alt={post.title} fill sizes="64px" className="object-cover" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          {prefix ? <p className="text-xs font-semibold text-slate-500">{prefix}</p> : null}
          <h3 className="mt-0.5 line-clamp-2 text-sm font-black leading-5 text-slate-950">{post.title}</h3>
          {post.description ? <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-slate-600 [overflow-wrap:anywhere]">{post.description}</p> : null}
          <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs font-semibold text-slate-400">
            {meta.map((item) => (
              <span key={item}>{item}</span>
            ))}
            <span>{post.meta}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ContinueViewing({ previousPost, nextPost }: { previousPost?: PostCardViewData | null; nextPost?: PostCardViewData | null }) {
  if (!previousPost && !nextPost) return null;

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <h2 className="text-base font-black text-slate-950">继续查看</h2>
      <div className="mt-3 space-y-2">
        {previousPost ? <DetailRecommendationCard post={previousPost} prefix="上一条" /> : null}
        {nextPost ? <DetailRecommendationCard post={nextPost} prefix="下一条" /> : null}
      </div>
    </section>
  );
}

function RelatedPosts({ posts }: { posts?: PostCardViewData[] }) {
  if (!posts?.length) return null;

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <h2 className="text-base font-black text-slate-950">相关信息</h2>
      <div className="mt-3 space-y-2">
        {posts.map((related) => (
          <DetailRecommendationCard key={related.id} post={related} />
        ))}
      </div>
    </section>
  );
}

export async function PostDetailView({
  post,
  adminReturnHref,
  previousPost,
  nextPost,
  relatedPosts,
}: {
  post: PostDetailViewData | null;
  adminReturnHref?: string | null;
  previousPost?: PostCardViewData | null;
  nextPost?: PostCardViewData | null;
  relatedPosts?: PostCardViewData[];
}) {
  if (!post) {
    return (
      <div className="space-y-3">
        {adminReturnHref ? <AdminReturnLink href={adminReturnHref} /> : null}
        <EmptyState title="内容不存在" description="这条信息不存在，或当前不是公开已发布状态。" />
      </div>
    );
  }

  const engagement = await getPostEngagementState(post.id, post.type, post.title);
  const backHref = listHref(post);
  const text = shareText(post);

  return (
    <article className="space-y-4">
      {adminReturnHref ? <AdminReturnLink href={adminReturnHref} /> : null}

      <DetailActionBar
        backHref={backHref}
        postId={post.id}
        postType={post.type}
        path={post.href}
        title={post.title}
        text={text}
        initialIsFavorited={engagement.isFavorited}
      />

      {post.type === "job" && post.images.length > 0 ? (
        <section className="space-y-3">
          {post.images.map((image) => (
            <div key={image.url} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-100 bg-slate-100 shadow-sm">
              <Image src={image.url} alt={image.caption || post.title} fill sizes="430px" className="object-cover" />
            </div>
          ))}
        </section>
      ) : null}

      {post.type === "job" ? null : <DetailImageCarousel images={post.images} title={post.title} />}

      {post.type === "job" ? (
        <>
          <section className="rounded-2xl border border-gray-100 border-t-blue-100 bg-white p-6 pt-7 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
            <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
            <PostDisplayBody body={post.body} footerLine={post.footerLine} />
            <DetailMetaPills items={post.detailMetaFields} postId={post.id} initialViewCount={post.viewCount || 0} />
          </section>
          <ContactRevealCard postId={post.id} compact />
        </>
      ) : (
        <>
          <section className="rounded-2xl border border-gray-100 border-t-blue-100 bg-white p-6 pt-7 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
            <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
            <PostDisplayBody body={post.body} footerLine={post.footerLine} />
            <DetailMetaPills items={post.detailMetaFields} postId={post.id} initialViewCount={post.viewCount || 0} />
          </section>

          <ContactRevealCard postId={post.id} compact={post.type !== "service"} defaultRevealed={post.type === "service"} alwaysVisible={post.type === "service"} />
        </>
      )}

      <DetailShareCard path={post.href} title={post.title} text={text} />

      <DetailSafetyNotice postId={post.id} returnTo={post.href} initialHasReported={engagement.hasReported} />

      <ContinueViewing previousPost={previousPost} nextPost={nextPost} />

      <RelatedPosts posts={relatedPosts} />

      <Link href={backHref} className="block rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-black text-slate-700">
        返回列表
      </Link>
    </article>
  );
}

function AdminReturnLink({ href }: { href: string }) {
  return (
    <Link href={href} className="block rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-center text-sm font-black text-blue-700">
      返回用户发布信息管理
    </Link>
  );
}
