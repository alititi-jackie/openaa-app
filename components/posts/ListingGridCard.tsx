"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { ChannelFallbackCover } from "@/components/common/ChannelFallbackCover";
import { DetailMetaPills } from "./DetailMetaPills";
import type { DetailMetaPill } from "./DetailMetaPills";
import type { PostCardData } from "./PostCard";

type ListingGridKind = "marketplace" | "service";

const bottomMetaKeys: Record<ListingGridKind, string[]> = {
  marketplace: ["mode", "area", "category"],
  service: ["category", "area"],
};

function visibleLineCount(element: HTMLElement | null) {
  if (!element) return 0;
  const style = window.getComputedStyle(element);
  const lineHeight = Number.parseFloat(style.lineHeight);
  const height = element.getBoundingClientRect().height;

  if (!Number.isFinite(lineHeight) || lineHeight <= 0 || height <= 0) return 0;
  return Math.max(1, Math.round(height / lineHeight));
}

function useShowPlaceholder(titleRef: RefObject<HTMLElement | null>, bodyRef: RefObject<HTMLElement | null>, fullRows: number) {
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  useEffect(() => {
    const measure = () => {
      const rows = visibleLineCount(titleRef.current) + visibleLineCount(bodyRef.current);
      setShowPlaceholder(rows > 0 && rows < fullRows);
    };

    measure();

    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    if (observer) {
      if (titleRef.current) observer.observe(titleRef.current);
      if (bodyRef.current) observer.observe(bodyRef.current);
    }

    window.addEventListener("resize", measure);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [bodyRef, fullRows, titleRef]);

  return showPlaceholder;
}

function orderedMetaItems(items: DetailMetaPill[], keys: string[]) {
  return keys.flatMap((key) => {
    const item = items.find((meta) => meta.key === key && meta.group === "business");
    return item ? [item] : [];
  });
}

function cardMeta(post: PostCardData, kind: ListingGridKind) {
  const items = post.listingMetaFields ?? [];

  return {
    commonItems: items.filter((item) => item.group === "common"),
    bottomItems: orderedMetaItems(items, bottomMetaKeys[kind]),
  };
}

function ListingImage({ post, kind }: { post: PostCardData; kind: ListingGridKind }) {
  const frameClass = kind === "service" ? "h-36 w-full sm:h-40" : "aspect-[3/2]";

  return (
    <div className={["relative overflow-hidden bg-slate-100", frameClass].join(" ")}>
      {post.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.imageUrl}
          alt={post.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
        />
      ) : (
        <ChannelFallbackCover kind={kind} className="absolute inset-0" />
      )}
    </div>
  );
}

export function ListingGridCard({ post, kind }: { post: PostCardData; kind: ListingGridKind }) {
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const bodyRef = useRef<HTMLParagraphElement | null>(null);
  const isMarketplace = kind === "marketplace";
  const fullRows = isMarketplace ? 4 : 3;
  const showPlaceholder = useShowPlaceholder(titleRef, bodyRef, fullRows);
  const body = post.displayBody || post.description;
  const { commonItems, bottomItems } = useMemo(() => cardMeta(post, kind), [kind, post]);

  return (
    <Link href={post.href} className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      <ListingImage post={post} kind={kind} />
      <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
        <h3 ref={titleRef} className={isMarketplace ? "line-clamp-2 text-sm font-black leading-5 text-slate-950 sm:text-base sm:leading-6" : "line-clamp-1 text-base font-black leading-6 text-slate-950"}>
          {post.title}
        </h3>
        <p ref={bodyRef} className="mt-1.5 line-clamp-2 break-words text-xs leading-5 text-slate-600 [overflow-wrap:anywhere] sm:text-sm sm:leading-6">
          {body}
        </p>

        {showPlaceholder && commonItems.length ? (
          <div className="mt-2 max-h-8 overflow-hidden">
            <DetailMetaPills items={commonItems} postId={post.id ?? post.href} initialViewCount={post.viewCount ?? 0} trackViews={false} oneLine className="!mt-0" />
          </div>
        ) : null}

        {bottomItems.length ? (
          <div className="mt-auto max-h-8 overflow-hidden pt-2">
            <DetailMetaPills items={bottomItems} postId={post.id ?? post.href} initialViewCount={post.viewCount ?? 0} trackViews={false} oneLine className="!mt-0" />
          </div>
        ) : null}
      </div>
    </Link>
  );
}
