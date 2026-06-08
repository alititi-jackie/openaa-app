"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { DetailImageLightbox, type DetailImage } from "./DetailImageLightbox";

type DetailImageCarouselProps = {
  images: DetailImage[];
  title: string;
};

const imageSizes = "(min-width: 768px) 720px, 100vw";

export function DetailImageCarousel({ images, title }: DetailImageCarouselProps) {
  const visibleImages = images.filter((image) => image.url.trim());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (visibleImages.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-100 shadow-sm">
      <Swiper
        modules={[Navigation, Pagination]}
        loop={visibleImages.length > 1}
        navigation={{
          prevEl: ".detail-image-prev",
          nextEl: ".detail-image-next",
        }}
        pagination={visibleImages.length > 1 ? { clickable: true } : false}
        touchRatio={1}
        className="detail-image-swiper"
      >
        {visibleImages.map((image, index) => (
          <SwiperSlide key={`${image.url}-${index}`}>
            <button type="button" onClick={() => setLightboxIndex(index)} className="relative block aspect-[4/3] w-full bg-slate-100 text-left" aria-label="查看大图">
              {canUseNextImage(image.url) ? (
                <Image
                  src={image.url}
                  alt={image.caption || title}
                  fill
                  sizes={imageSizes}
                  className="select-none object-cover"
                  draggable={false}
                  priority={index === 0}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image.url}
                  alt={image.caption || title}
                  className="h-full w-full select-none object-cover"
                  draggable={false}
                  loading={index === 0 ? "eager" : "lazy"}
                />
              )}
            </button>
          </SwiperSlide>
        ))}
      </Swiper>

      {visibleImages.length > 1 ? (
        <>
          <button
            type="button"
            className="detail-image-prev absolute left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-slate-800 shadow-md transition hover:bg-white md:grid"
            aria-label="上一张图片"
          >
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="detail-image-next absolute right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-slate-800 shadow-md transition hover:bg-white md:grid"
            aria-label="下一张图片"
          >
            <ChevronRight size={22} aria-hidden="true" />
          </button>
        </>
      ) : null}

      {lightboxIndex === null ? null : (
        <DetailImageLightbox images={visibleImages} activeIndex={lightboxIndex} title={title} onClose={() => setLightboxIndex(null)} onNavigate={setLightboxIndex} />
      )}
    </section>
  );
}

function canUseNextImage(src: string) {
  if (src.startsWith("/")) return true;

  try {
    const hostname = new URL(src).hostname;
    return hostname === "img.openaa.com";
  } catch {
    return false;
  }
}
