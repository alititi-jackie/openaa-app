import Image from "next/image";
import Link from "next/link";

export type PostCardData = {
  id?: string;
  type?: "job" | "housing" | "marketplace" | "service";
  title: string;
  description: string;
  href: string;
  meta: string;
  tag?: string;
  location?: string;
  authorName?: string;
  imageUrl?: string;
  favoriteCount?: number;
  viewCount?: number;
  fields?: Array<{ label: string; value: string }>;
  listDisplay?: {
    badge?: string;
    secondaryBadge?: string;
    price?: string;
    salary?: string;
    area?: string;
    category?: string;
    companyName?: string;
    publishedLabel?: string;
  };
};

function fieldValue(post: PostCardData, label: string) {
  return post.fields?.find((field) => field.label === label)?.value || "";
}

function publishedLabel(post: PostCardData) {
  return post.listDisplay?.publishedLabel || post.meta;
}

function JobPostCard({ post }: { post: PostCardData }) {
  const salary = post.listDisplay?.salary || fieldValue(post, "薪资");
  const area = post.listDisplay?.area || fieldValue(post, "区域") || post.location;
  const category = post.listDisplay?.category || post.tag;
  const companyName = post.listDisplay?.companyName;
  const badge = post.listDisplay?.badge || post.tag;

  return (
    <Link href={post.href} className="block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:bg-zinc-50">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-lg font-semibold text-gray-900">{post.title}</h3>
            {companyName ? <p className="mt-1 line-clamp-1 break-all text-gray-600">{companyName}</p> : null}
          </div>
          {badge ? <span className="max-w-[9rem] shrink-0 truncate rounded bg-blue-50 px-2 py-1 text-sm font-medium text-[#1976d2]">{badge}</span> : null}
        </div>

        {salary ? <p className="mt-2 font-semibold text-green-600">{salary}</p> : null}

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          {area ? <span>{area}</span> : null}
          {area && category ? <span>·</span> : null}
          {category ? <span>{category}</span> : null}
        </div>

        <div className="mt-3">
          <p className="line-clamp-2 text-sm text-gray-500">{post.description}</p>
          <span className="mt-1 block text-xs text-gray-400">{publishedLabel(post)}</span>
        </div>
      </div>
    </Link>
  );
}

function HousingPostCard({ post }: { post: PostCardData }) {
  const display = post.listDisplay;
  const price = display?.price || fieldValue(post, "价格");
  const area = display?.area || fieldValue(post, "区域") || post.location;
  const badge = display?.badge || post.tag;
  const roomType = display?.secondaryBadge || fieldValue(post, "房型");

  return (
    <Link href={post.href} className="block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:bg-zinc-50">
      <div className="p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="max-w-[260px] line-clamp-2 font-semibold text-gray-900 sm:max-w-[520px]">{post.title}</h3>
            {badge ? <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 ring-1 ring-blue-100">{badge}</span> : null}
            {roomType ? <span className="rounded-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600 ring-1 ring-zinc-100">{roomType}</span> : null}
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            {price ? <span className="font-semibold text-[#1976d2]">{price}</span> : null}
            {area ? <span>{area}</span> : null}
          </div>

          <p className="mt-3 line-clamp-2 whitespace-pre-wrap text-sm text-gray-600">{post.description}</p>
          <span className="mt-2 block text-xs text-gray-400">{publishedLabel(post)}</span>
        </div>
      </div>
    </Link>
  );
}

function MarketplacePostCard({ post }: { post: PostCardData }) {
  const display = post.listDisplay;
  const price = display?.price || fieldValue(post, "价格");
  const badge = display?.badge || post.tag;
  const category = display?.category || post.tag;

  return (
    <Link href={post.href} className="block overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative h-48 bg-gray-100">
        {post.imageUrl ? (
          <Image src={post.imageUrl} alt={post.title} fill sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-gray-400">暂无图片</div>
        )}
        {badge ? <span className="absolute left-2 top-2 rounded bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">{badge}</span> : null}
      </div>
      <div className="p-3">
        {price ? <p className="text-lg font-semibold text-[#1976d2]">{price}</p> : null}
        <h3 className="mt-1 line-clamp-2 font-medium text-gray-900">{post.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-gray-600">{post.description}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          {category ? <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{category}</span> : <span />}
          <span className="shrink-0 text-xs text-gray-400">{publishedLabel(post)}</span>
        </div>
      </div>
    </Link>
  );
}

function ServicePostCard({ post }: { post: PostCardData }) {
  const display = post.listDisplay;
  const category = display?.category || post.tag;
  const area = display?.area || post.location;
  const price = display?.price || fieldValue(post, "价格");

  return (
    <Link href={post.href} className="block overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md">
      {post.imageUrl ? (
        <div className="relative h-36 w-full bg-zinc-100">
          <Image src={post.imageUrl} alt={post.title} fill sizes="(min-width: 768px) 420px, 100vw" className="object-cover" />
        </div>
      ) : (
        <div className="flex h-36 w-full items-center justify-center bg-zinc-50 text-sm font-semibold text-gray-400">暂无图片</div>
      )}
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900">{post.title}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
          {category ? <span>{category}</span> : null}
          {category && area ? <span>·</span> : null}
          {area ? <span>{area}</span> : null}
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-gray-600">{post.description}</p>
        {price ? <p className="mt-1 text-xs text-blue-600">{price}</p> : null}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-400">{publishedLabel(post)}</span>
          <span className="text-xs font-medium text-[#1976d2]">查看详情 →</span>
        </div>
      </div>
    </Link>
  );
}

export function PostCard({ post, compact = false }: { post: PostCardData; compact?: boolean }) {
  if (post.type === "job") return <JobPostCard post={post} />;
  if (post.type === "housing") return <HousingPostCard post={post} />;
  if (post.type === "marketplace") return <MarketplacePostCard post={post} />;
  if (post.type === "service") return <ServicePostCard post={post} />;

  return (
    <Link href={post.href} className="block rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="min-w-0">
        {post.tag ? <p className="mb-1 text-xs font-bold text-blue-700">{post.tag}</p> : null}
        <h3 className="line-clamp-2 font-black leading-snug text-slate-950">{post.title}</h3>
        {!compact ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{post.description}</p> : null}
      </div>
    </Link>
  );
}
