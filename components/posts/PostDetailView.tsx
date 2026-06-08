import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";
import { POST_TYPE_LABELS } from "@/features/posts/constants";
import { getPostEngagementState } from "@/features/posts/engagementQueries";
import type { PostDetailView as PostDetailViewData } from "@/features/posts/types";
import { ContactSourceHint } from "./ContactSourceHint";
import { DetailImageCarousel } from "./DetailImageCarousel";
import { DetailMetaPills, type DetailMetaPill } from "./DetailMetaPills";
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

function fieldValue(post: PostDetailViewData, label: string) {
  return post.fields.find((field) => field.label === label)?.value?.trim() ?? "";
}

function jobInfoItems(post: PostDetailViewData): DetailMetaPill[] {
  const salary = fieldValue(post, "薪资") || "薪资电议";
  const area = fieldValue(post, "区域") || post.location || "";
  const workType = fieldValue(post, "类型");
  const category = post.tag && post.tag !== POST_TYPE_LABELS[post.type] ? post.tag : "";
  const published = post.publishedAt || post.createdAt;

  return [
    { label: "发布者", value: post.authorName || "匿名用户" },
    { label: "浏览次数", value: String(post.viewCount || 0) },
    { label: "相对时间", value: published },
    { label: "地区", value: area ? `📍 ${area}` : "" },
    { label: "职位分类", value: category },
    { label: "类型", value: workType },
    { label: "薪资", value: salary },
  ].filter((item) => item.value);
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
            <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-gray-600">{post.body}</p>
            <ContactSourceHint className="text-base" />
            <DetailMetaPills items={jobInfoItems(post)} postId={post.id} initialViewCount={post.viewCount || 0} />
          </section>
          <ContactRevealCard postId={post.id} compact />
        </>
      ) : (
        <>
          <section className="rounded-2xl border border-gray-100 border-t-blue-100 bg-white p-6 pt-7 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
            <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
            <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-gray-600">{post.body}</p>
            <ContactSourceHint className="text-base" />
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
