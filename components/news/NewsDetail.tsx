import Link from "next/link";
import { DetailBackButton } from "@/components/common/DetailBackButton";
import { FavoriteButton } from "@/components/common/FavoriteButton";
import { PageShareButton } from "@/components/common/PageShareButton";
import { DetailShareCard } from "@/components/posts/DetailShareCard";
import { formatNewsDate } from "@/features/news/mappers";
import type { NewsPostCard, NewsPostDetail } from "@/features/news/types";
import { appUrl } from "@/lib/seo/siteConfig";
import { NewsCover } from "./NewsCover";

type NewsDetailProps = {
  post: NewsPostDetail;
  previousPost: NewsPostCard | null;
  nextPost: NewsPostCard | null;
  relatedPosts: NewsPostCard[];
  initialIsFavorited: boolean;
};

function visibleParagraphs(body: string) {
  return body.split(/\n+/).map((part) => part.trim()).filter(Boolean);
}

function NewsSuggestionCard({ post }: { post: NewsPostDetail }) {
  const feedbackHref = `/feedback?${new URLSearchParams({
    related_url: appUrl(post.href),
    target_type: "news",
    target_id: post.id,
  }).toString()}`;

  return (
    <section className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
      <h2 className="text-base font-bold text-zinc-900">有新闻线索或投稿建议？</h2>
      <p className="mt-1 text-[15px] leading-relaxed text-zinc-700">
        如果你有纽约华人生活相关的新闻线索、活动信息、实用资讯，或发现本文内容需要更正，欢迎提交给 OpenAA。
      </p>
      <div className="mt-3">
        <Link
          href={feedbackHref}
          className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
        >
          提交新闻线索 / 建议
        </Link>
      </div>
    </section>
  );
}

function OpenAAAttractCard() {
  return (
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-sky-50 p-4">
      <p className="text-sm font-bold text-blue-900">OpenAA 美国华人生活平台</p>
      <p className="mt-1 text-xs text-blue-700">
        一站查看招聘、房屋、二手、本地服务与实用资讯，获取最新华人生活信息。
      </p>
      <div className="mt-3 flex gap-2">
        <Link href="/" className="inline-flex items-center rounded-lg bg-[#1976d2] px-3 py-1.5 text-xs font-semibold text-white">
          回到首页
        </Link>
        <Link
          href="/services"
          className="inline-flex items-center rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700"
        >
          查看本地服务
        </Link>
      </div>
    </div>
  );
}

function ContinueReading({ previousPost, nextPost }: { previousPost: NewsPostCard | null; nextPost: NewsPostCard | null }) {
  if (!previousPost && !nextPost) return null;

  return (
    <div className="mt-7 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
      <h2 className="text-base font-bold text-zinc-900">继续阅读</h2>
      <div className="mt-3 space-y-2">
        {previousPost ? (
          <Link
            href={previousPost.href}
            className="block rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100"
          >
            <span className="text-zinc-500">上一篇：</span>
            {previousPost.title}
          </Link>
        ) : null}
        {nextPost ? (
          <Link
            href={nextPost.href}
            className="block rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100"
          >
            <span className="text-zinc-500">下一篇：</span>
            {nextPost.title}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function RelatedNews({ posts }: { posts: NewsPostCard[] }) {
  if (posts.length === 0) return null;

  return (
    <div className="mt-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
      <h2 className="text-base font-bold text-zinc-900">相关阅读</h2>
      <div className="mt-3 space-y-3">
        {posts.map((related) => (
          <Link
            key={related.id}
            href={related.href}
            className="block rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 transition hover:bg-zinc-100"
          >
            <p className="text-xs font-medium text-blue-600">{related.categoryName}</p>
            <h3 className="mt-1 text-sm font-semibold text-zinc-900">{related.title}</h3>
            {related.excerpt ? <p className="mt-1 line-clamp-2 text-xs text-zinc-600">{related.excerpt}</p> : null}
            <p className="mt-2 text-xs text-zinc-400">{formatNewsDate(related.publishedAt)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function NewsDetail({ post, previousPost, nextPost, relatedPosts, initialIsFavorited }: NewsDetailProps) {
  const paragraphs = visibleParagraphs(post.body);
  const publishedSource = post.publishedAt;
  const modifiedSource = post.updatedAt && post.updatedAt !== publishedSource ? post.updatedAt : null;
  const shareText = post.excerpt || post.title;

  return (
    <article className="pb-24">
      <div className="flex items-center justify-between">
        <DetailBackButton fallbackHref="/news" />
        <div className="flex items-center gap-2">
          <FavoriteButton
            target={{ type: "news", id: post.id, url: post.href, title: post.title, category: "新闻" }}
            returnTo={post.href}
            initialIsFavorited={initialIsFavorited}
          />
          <PageShareButton path={post.href} title={post.title} text={shareText} />
        </div>
      </div>

      <p className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{post.categoryName}</p>
      <h1 className="mt-2 text-2xl font-black leading-tight text-zinc-900">{post.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-400">
        <p>发布时间：{formatNewsDate(publishedSource)}</p>
        <p>更新时间：{modifiedSource ? formatNewsDate(modifiedSource) : "暂无更新"}</p>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-100">
        <NewsCover src={post.coverImageUrl} alt={post.title} className="h-52 w-full" priority />
      </div>

      <div className="mt-5 space-y-4 text-[15px] leading-7 text-zinc-800">
        {paragraphs.map((paragraph, index) => (
          <p key={`${post.id}-${index}`}>{paragraph}</p>
        ))}
      </div>

      <DetailShareCard path={post.href} title={post.title} text={shareText} className="mt-6" />
      <NewsSuggestionCard post={post} />
      <ContinueReading previousPost={previousPost} nextPost={nextPost} />
      <RelatedNews posts={relatedPosts} />
      <div className="mt-6">
        <OpenAAAttractCard />
      </div>
    </article>
  );
}
