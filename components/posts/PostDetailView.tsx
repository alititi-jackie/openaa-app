import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";
import { getPostEngagementState } from "@/features/posts/engagementQueries";
import type { PostDetailView as PostDetailViewData } from "@/features/posts/types";
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

export async function PostDetailView({ post }: { post: PostDetailViewData | null }) {
  if (!post) {
    return <EmptyState title="内容不存在" description="这条信息不存在，或当前不是公开已发布状态。" />;
  }

  const engagement = await getPostEngagementState(post.id);
  const backHref = listHref(post);
  const text = shareText(post);

  return (
    <article className="space-y-4">
      <DetailActionBar
        backHref={backHref}
        postId={post.id}
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

      <Link href={backHref} className="block rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-black text-slate-700">
        返回列表
      </Link>
    </article>
  );
}
