"use client";

import { useState } from "react";
import { ChannelFallbackCover } from "@/components/common/ChannelFallbackCover";
import { DetailImageCarousel } from "@/components/posts/DetailImageCarousel";

type NewsDetailImageProps = {
  src?: string | null;
  title: string;
};

export function NewsDetailImage({ src, title }: NewsDetailImageProps) {
  const [broken, setBroken] = useState(false);
  const imageSrc = typeof src === "string" ? src.trim() : "";

  if (!imageSrc || broken) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-100 shadow-sm">
        <ChannelFallbackCover kind="news" className="h-[220px] w-full sm:h-[250px] md:h-[380px]" />
      </div>
    );
  }

  return (
    <DetailImageCarousel
      images={[{ url: imageSrc }]}
      title={title}
      onImageError={() => setBroken(true)}
    />
  );
}
