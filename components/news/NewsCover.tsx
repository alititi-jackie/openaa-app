"use client";

import Image from "next/image";
import { useState } from "react";
import { ChannelFallbackCover } from "@/components/common/ChannelFallbackCover";

type NewsCoverProps = {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

const defaultSizes = "(min-width: 768px) 420px, 100vw";

function canUseNextImage(src: string) {
  if (src.startsWith("/")) return true;

  try {
    const hostname = new URL(src).hostname;
    return hostname === "img.openaa.com" || hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

function Fallback({ className }: { className?: string }) {
  return <ChannelFallbackCover kind="news" className={className} />;
}

export function NewsCover({ src, alt, className, sizes = defaultSizes, priority = false }: NewsCoverProps) {
  const [broken, setBroken] = useState(false);
  const imageSrc = typeof src === "string" ? src.trim() : "";
  const wrapperClassName = `${className ?? ""} relative block overflow-hidden bg-zinc-100`.trim();
  const imageClassName = `${className ?? ""} object-cover bg-zinc-100`.trim();

  if (!imageSrc || broken) return <Fallback className={className} />;

  if (canUseNextImage(imageSrc)) {
    return (
      <span className={wrapperClassName}>
        <Image
          src={imageSrc}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover"
          onError={() => setBroken(true)}
          {...(priority ? { priority: true } : { loading: "lazy" as const })}
        />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageSrc} alt={alt} onError={() => setBroken(true)} loading={priority ? "eager" : "lazy"} className={imageClassName} />
  );
}
