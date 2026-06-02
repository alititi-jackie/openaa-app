"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export type HomeBannerItem = {
  title: string;
  description: string;
  href: string;
  imageUrl: string;
};

export function HomeBanner({ item, items }: { item?: HomeBannerItem; items?: HomeBannerItem[] }) {
  const slides = item ? [item] : (items ?? []).filter((banner) => banner.imageUrl);
  const [index, setIndex] = useState(0);
  const banner = slides[index] ?? slides[0];

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!banner) {
    return null;
  }

  return (
    <section className="relative">
      <BannerLink banner={banner} isFirst={index === 0} />
      {slides.length > 1 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
          {slides.map((slide, slideIndex) => (
            <span
              key={`${slide.href}-${slide.imageUrl}-${slideIndex}`}
              className={`h-1.5 rounded-full transition-all ${slideIndex === index ? "w-5 bg-white" : "w-1.5 bg-white/60"}`}
              aria-hidden="true"
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function BannerLink({ banner, isFirst }: { banner: HomeBannerItem; isFirst: boolean }) {
  const image = (
    <div className="relative h-[160px] w-full bg-zinc-100 sm:h-[180px] md:h-[200px]">
      <Image
        src={banner.imageUrl}
        alt={banner.title || ""}
        fill
        sizes="(min-width: 1040px) 1040px, 100vw"
        className="select-none object-cover"
        draggable={false}
        priority={isFirst}
      />
    </div>
  );

  const className = "block w-full overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)] ring-1 ring-black/5";

  if (isExternalHref(banner.href)) {
    return (
      <a href={banner.href} target="_blank" rel="noopener noreferrer" className={className} aria-label={banner.title || "OpenAA banner"}>
        {image}
      </a>
    );
  }

  return (
    <Link href={banner.href || "/"} className={className} aria-label={banner.title || "OpenAA banner"}>
      {image}
    </Link>
  );
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}
