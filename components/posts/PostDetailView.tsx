import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";
import { POST_TYPE_LABELS } from "@/features/posts/constants";
import { getPostEngagementState } from "@/features/posts/engagementQueries";
import type { PostDetailView as PostDetailViewData } from "@/features/posts/types";
import { ContactRevealCard } from "./ContactRevealCard";
import { PostEngagementPanel } from "./PostEngagementPanel";

export async function PostDetailView({ post }: { post: PostDetailViewData | null }) {
  if (!post) {
    return <EmptyState title="内容不存在" description="这条信息不存在，或当前不是公开已发布状态。" />;
  }

  const engagement = await getPostEngagementState(post.id);

  return (
    <article className="space-y-4">
      <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="text-xs font-bold text-blue-700">{POST_TYPE_LABELS[post.type]}</p>
        <h1 className="mt-2 text-2xl font-black leading-tight text-slate-950">{post.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
          <span className="rounded-full bg-slate-100 px-2.5 py-1">{post.meta}</span>
          {post.location ? <span className="rounded-full bg-slate-100 px-2.5 py-1">{post.location}</span> : null}
          {post.authorName ? <span className="rounded-full bg-slate-100 px-2.5 py-1">{post.authorName}</span> : null}
        </div>
      </section>

      {post.images.length > 0 ? (
        <section className="space-y-3">
          {post.images.map((image) => (
            <div key={image.url} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-100 bg-slate-100 shadow-sm">
              <Image src={image.url} alt={image.caption || post.title} fill sizes="430px" className="object-cover" />
            </div>
          ))}
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">详情</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{post.body}</p>
        {post.fields.length > 0 ? (
          <dl className="mt-4 grid gap-2">
            {post.fields.map((field) => (
              <div key={`${field.label}-${field.value}`} className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <dt className="shrink-0 font-bold text-slate-700">{field.label}</dt>
                <dd className="min-w-0 truncate text-right text-slate-900">{field.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
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

      <ContactRevealCard postId={post.id} />

      <Link href={post.href.replace(`/${post.id}`, "")} className="block rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-black text-slate-700">
        返回列表
      </Link>
    </article>
  );
}
