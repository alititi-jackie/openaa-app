"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type DetailImage = {
  url: string;
  caption?: string | null;
};

type DetailImageLightboxProps = {
  images: DetailImage[];
  activeIndex: number;
  title: string;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

export function DetailImageLightbox({ images, activeIndex, title, onClose, onNavigate }: DetailImageLightboxProps) {
  const image = images[activeIndex];
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && images.length > 1) goTo(-1);
      if (event.key === "ArrowRight" && images.length > 1) goTo(1);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  if (!image) {
    return null;
  }

  function goTo(offset: number) {
    onNavigate((activeIndex + offset + images.length) % images.length);
  }

  function onTouchEnd(value: number) {
    if (touchStartX.current === null || images.length <= 1) return;
    const delta = value - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(delta) < 40) return;
    goTo(delta > 0 ? -1 : 1);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black" onTouchStart={(event) => (touchStartX.current = event.touches[0]?.clientX ?? null)} onTouchEnd={(event) => onTouchEnd(event.changedTouches[0]?.clientX ?? 0)}>
      <button
        type="button"
        onClick={onClose}
        className="absolute left-4 top-4 z-20 inline-flex min-h-11 items-center justify-center rounded-full bg-white/95 px-4 text-sm font-semibold text-slate-950 shadow-lg"
      >
        ← 返回
      </button>

      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="relative h-full w-full">
          {canUseNextImage(image.url) ? (
            <Image src={image.url} alt={image.caption || title} fill sizes="100vw" className="select-none object-contain" draggable={false} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image.url} alt={image.caption || title} className="h-full w-full select-none object-contain" draggable={false} />
          )}
        </div>
      </div>

      {images.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => goTo(-1)}
            className="absolute left-3 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-950 shadow-lg transition hover:bg-white"
            aria-label="上一张图片"
          >
            <ChevronLeft size={24} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goTo(1)}
            className="absolute right-3 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-950 shadow-lg transition hover:bg-white"
            aria-label="下一张图片"
          >
            <ChevronRight size={24} aria-hidden="true" />
          </button>
          <div className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800">
            {activeIndex + 1} / {images.length}
          </div>
        </>
      ) : null}
    </div>
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
