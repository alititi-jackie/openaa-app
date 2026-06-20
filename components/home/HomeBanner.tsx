"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ImageOff } from "lucide-react";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";

export type HomeBannerItem = {
  title: string;
  description: string;
  href: string;
  imageUrl: string;
  openMode?: "same" | "new" | "internal" | "external_new" | "external_same" | string | null;
  slug?: string | null;
};

export function HomeBanner({ item, items }: { item?: HomeBannerItem; items?: HomeBannerItem[] }) {
  const slides = useMemo(() => (item ? [item] : (items ?? []).filter((banner) => normalizeImageUrl(banner.imageUrl))), [item, items]);

  if (slides.length === 0) {
    return null;
  }

  return (
    <section className="relative">
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)] ring-1 ring-black/5">
        <Swiper
          modules={[Autoplay, Pagination]}
          loop={slides.length > 1}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          touchRatio={1}
          className="banner-swiper"
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={`${slide.href}-${slide.imageUrl}-${index}`}>{renderSlideContent(slide, index)}</SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}

function renderSlideContent(slide: HomeBannerItem, index: number) {
  const imageUrl = normalizeImageUrl(slide.imageUrl);
  const isFirstSlide = index === 0;

  if (!imageUrl) return null;

  const image = <BannerImage src={imageUrl} title={slide.title} eager={isFirstSlide} />;
  const href = normalizeHref(slide);
  const openMode = normalizeOpenMode(slide);

  if (openMode === "internal" && slide.slug) {
    return (
      <Link href={`/ads/${slide.slug}`} className="block w-full" aria-label={slide.title || "OpenAA banner"}>
        {image}
      </Link>
    );
  }

  if (isExternalHref(href)) {
    if (openMode === "same") {
      return (
        <button
          type="button"
          className="block w-full text-left"
          aria-label={slide.title || "OpenAA banner"}
          onClick={() => {
            window.location.href = href;
          }}
        >
          {image}
        </button>
      );
    }

    return (
      <button type="button" className="block w-full text-left" aria-label={slide.title || "OpenAA banner"} onClick={() => window.open(href, "_blank", "noopener,noreferrer")}>
        {image}
      </button>
    );
  }

  if (href) {
    return (
      <Link href={href} className="block w-full" aria-label={slide.title || "OpenAA banner"}>
        {image}
      </Link>
    );
  }

  return image;
}

function BannerImage({ src, title, eager }: { src: string; title: string; eager: boolean }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative h-[160px] w-full bg-zinc-100 sm:h-[180px] md:h-[200px]">
      {failed ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center text-zinc-500">
          <ImageOff size={24} />
          <p className="line-clamp-1 text-sm font-bold text-zinc-700">{title}</p>
          <p className="text-xs">广告图片暂时无法加载</p>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={title || "OpenAA 广告图片"}
          className="h-full w-full select-none object-cover"
          draggable={false}
          loading={eager ? "eager" : "lazy"}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

function normalizeImageUrl(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function normalizeHref(banner: HomeBannerItem) {
  if (banner.openMode === "internal" && banner.slug) {
    return `/ads/${banner.slug}`;
  }

  return banner.href?.trim() || "";
}

function normalizeOpenMode(banner: HomeBannerItem) {
  if (banner.openMode === "external_new") return "new";
  if (banner.openMode === "external_same") return "same";
  if (banner.openMode === "internal") return "internal";
  return banner.openMode === "new" ? "new" : "same";
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}
