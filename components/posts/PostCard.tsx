import Link from "next/link";
import Image from "next/image";
import { Eye, Heart } from "lucide-react";
import { relativeTime, postModeLabel } from "@/features/posts/display";
import type { PostType } from "@/features/posts/types";
import { ContactSourceHint } from "./ContactSourceHint";

export type PostCardVariant = "default" | "detail-list";

export type PostCardData = {
  id?: string;
  type?: PostType;
  mode?: string | null;
  title: string;
  description: string;
  href: string;
  meta: string;
  tag?: string;
  categoryValue?: string;
  location?: string;
  area?: string;
  priceDisplay?: string;
  secondaryTag?: string;
  createdAt?: string;
  publishedAt?: string | null;
  authorName?: string;
  imageUrl?: string;
  favoriteCount?: number;
  viewCount?: number;
  fields?: Array<{ label: string; value: string }>;
};

export function PostCard({ post, compact = false, variant = "default" }: { post: PostCardData; compact?: boolean; variant?: PostCardVariant }) {
  if (variant === "detail-list") {
    return <DetailListPostCard post={post} />;
  }

  return (
    <Link href={post.href} className="block rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        {post.imageUrl ? (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
            <Image src={post.imageUrl} alt={post.title} fill sizes="80px" className="object-cover" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {post.tag ? <p className="mb-1 text-xs font-bold text-blue-700">{post.tag}</p> : null}
              <h3 className="line-clamp-2 font-black leading-snug text-slate-950">{post.title}</h3>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{post.meta}</span>
          </div>
          {!compact ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{post.description}</p> : null}
          {post.fields?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.fields.slice(0, compact ? 2 : 4).map((field) => (
                <span key={`${field.label}-${field.value}`} className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
                  {field.label}: {field.value}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
            {post.location ? <span>{post.location}</span> : null}
            {post.authorName ? <span>{post.authorName}</span> : null}
            <span className="inline-flex items-center gap-1">
              <Eye size={13} aria-hidden="true" />
              {post.viewCount ?? 0}
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart size={13} aria-hidden="true" />
              {post.favoriteCount ?? 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function DetailListPostCard({ post }: { post: PostCardData }) {
  const primaryMeta = detailPrimaryMeta(post);
  const secondaryMeta = detailSecondaryMeta(post);

  return (
    <Link href={post.href} className="block rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        {post.imageUrl ? (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
            <Image src={post.imageUrl} alt={post.title} fill sizes="80px" className="object-cover" />
          </div>
        ) : null}
        <div className="flex min-h-[136px] min-w-0 flex-1 flex-col">
          <h3 className="truncate font-black leading-snug text-slate-950">{post.title}</h3>
          <div className="mt-2 h-12 overflow-hidden text-sm leading-6">
            <p className="truncate text-slate-600">{post.description}</p>
            <ContactSourceHint className="mt-0 truncate text-sm leading-6" />
          </div>
          <div className="mt-auto pt-3 text-xs font-semibold text-slate-500">
            <div className="flex min-w-0 items-center gap-3 overflow-hidden whitespace-nowrap md:hidden">
              {primaryMeta.map((item) => (
                <span key={item} className="shrink-0">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-1 flex min-w-0 items-center gap-3 overflow-hidden whitespace-nowrap md:hidden">
              {secondaryMeta.map((item, index) => (
                <span key={item} className={index === 0 ? "min-w-0 truncate" : "shrink-0"}>
                  {item}
                </span>
              ))}
            </div>
            <div className="hidden min-w-0 items-center gap-3 overflow-hidden whitespace-nowrap md:flex">
              {[...primaryMeta, ...secondaryMeta].map((item, index) => (
                <span key={item} className={index === primaryMeta.length ? "min-w-0 truncate" : "shrink-0"}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function detailPrimaryMeta(post: PostCardData) {
  const viewCount = Number.isFinite(post.viewCount) ? post.viewCount : 0;
  return [
    post.authorName || "匿名用户",
    `👁 ${viewCount} 次浏览`,
    relativeTime(post.publishedAt || post.createdAt) || post.meta,
    post.imageUrl ? "🖼️" : "",
  ].filter(Boolean);
}

function detailSecondaryMeta(post: PostCardData) {
  const area = post.area || post.location;
  const mode = post.type && post.mode ? postModeLabel(post.type, post.mode, "short") : "";
  const category = cleanDisplayValue(post.categoryValue || post.tag);
  const secondary = cleanDisplayValue(post.secondaryTag);
  const price = post.priceDisplay;

  if (post.type === "housing") {
    return [area ? `📍 ${area}` : "", mode, category, price].filter(Boolean);
  }

  return [area ? `📍 ${area}` : "", category, secondary, price].filter(Boolean);
}

function cleanDisplayValue(value?: string | null) {
  if (!value) return "";
  const labels: Record<string, string> = {
    hiring: "招聘",
    seeking: "求职",
    supply: "出租",
    demand: "求租",
    selling: "出售",
    buying: "求购",
    fulltime: "全职",
    "full-time": "全职",
    parttime: "兼职",
    "part-time": "兼职",
  };
  return labels[value] ?? value;
}
