"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export type HomeBannerItem = {
  title: string;
  description: string;
  href: string;
  imageUrl: string;
  openMode?: "same" | "new" | "internal" | "external_new" | "external_same" | string | null;
  slug?: string | null;
};

const autoPlayMs = 4000;
const dragThreshold = 45;

export function HomeBanner({ item, items }: { item?: HomeBannerItem; items?: HomeBannerItem[] }) {
  const slides = useMemo(() => (item ? [item] : (items ?? []).filter((banner) => banner.imageUrl)), [item, items]);
  const [index, setIndex] = useState(slides.length > 1 ? 1 : 0);
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const dragLockedRef = useRef<"x" | "y" | null>(null);
  const pauseUntilRef = useRef(0);
  const resetFrameRef = useRef<number | null>(null);
  const enableFrameRef = useRef<number | null>(null);

  const trackSlides = useMemo(() => {
    if (slides.length <= 1) return slides;
    return [slides[slides.length - 1], ...slides, slides[0]];
  }, [slides]);

  const activeIndex = slides.length <= 1 ? 0 : (index - 1 + slides.length) % slides.length;

  useEffect(() => {
    setTransitionEnabled(false);
    setOffset(0);
    setIndex(slides.length > 1 ? 1 : 0);
    enableTransitionAfterPaint();

    return () => {
      cancelScheduledFrames();
    };
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = window.setInterval(() => {
      if (Date.now() < pauseUntilRef.current) return;
      setTransitionEnabled(true);
      setOffset(0);
      setIndex((current) => current + 1);
    }, autoPlayMs);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) {
    return null;
  }

  function pauseAutoPlay() {
    pauseUntilRef.current = Date.now() + autoPlayMs;
  }

  function cancelScheduledFrames() {
    if (resetFrameRef.current !== null) {
      window.cancelAnimationFrame(resetFrameRef.current);
      resetFrameRef.current = null;
    }

    if (enableFrameRef.current !== null) {
      window.cancelAnimationFrame(enableFrameRef.current);
      enableFrameRef.current = null;
    }
  }

  function enableTransitionAfterPaint() {
    cancelScheduledFrames();
    resetFrameRef.current = window.requestAnimationFrame(() => {
      enableFrameRef.current = window.requestAnimationFrame(() => {
        setTransitionEnabled(true);
        resetFrameRef.current = null;
        enableFrameRef.current = null;
      });
    });
  }

  function jumpToRealSlideWithoutAnimation(realTrackIndex: number) {
    setTransitionEnabled(false);
    setOffset(0);
    setIndex(realTrackIndex);
    enableTransitionAfterPaint();
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (slides.length <= 1) return;
    const touch = event.touches[0];
    startXRef.current = touch?.clientX ?? null;
    startYRef.current = touch?.clientY ?? null;
    dragLockedRef.current = null;
    setIsDragging(true);
    setTransitionEnabled(false);
    pauseAutoPlay();
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    const startX = startXRef.current;
    const startY = startYRef.current;
    const touch = event.touches[0];
    if (slides.length <= 1 || startX === null || startY === null || !touch) return;

    const nextOffset = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    if (!dragLockedRef.current) {
      if (Math.abs(nextOffset) < 8 && Math.abs(deltaY) < 8) return;
      dragLockedRef.current = Math.abs(nextOffset) > Math.abs(deltaY) ? "x" : "y";
    }

    if (dragLockedRef.current !== "x") return;

    event.preventDefault();
    setOffset(nextOffset);
  }

  function handleTouchEnd() {
    if (slides.length <= 1) return;

    const finalOffset = offset;
    startXRef.current = null;
    startYRef.current = null;
    dragLockedRef.current = null;
    setIsDragging(false);
    setTransitionEnabled(true);
    setOffset(0);
    pauseAutoPlay();

    if (Math.abs(finalOffset) < dragThreshold) return;

    setIndex((current) => current + (finalOffset < 0 ? 1 : -1));
  }

  function handleTransitionEnd(event: React.TransitionEvent<HTMLDivElement>) {
    if (slides.length <= 1) return;
    if (event.target !== event.currentTarget) return;

    if (index === 0) {
      jumpToRealSlideWithoutAnimation(slides.length);
    } else if (index === slides.length + 1) {
      jumpToRealSlideWithoutAnimation(1);
    }
  }

  function goToSlide(slideIndex: number) {
    if (slides.length <= 1) return;
    pauseAutoPlay();
    setTransitionEnabled(true);
    setOffset(0);

    if (activeIndex === slides.length - 1 && slideIndex === 0) {
      setIndex(slides.length + 1);
      return;
    }

    if (activeIndex === 0 && slideIndex === slides.length - 1) {
      setIndex(0);
      return;
    }

    setIndex(slideIndex + 1);
  }

  const translate = `calc(${-index * 100}% + ${offset}px)`;

  return (
    <section className="relative">
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)] ring-1 ring-black/5">
        <div
          className={`flex touch-pan-y select-none ${transitionEnabled && !isDragging ? "transition-transform duration-300 ease-out" : ""}`}
          style={{ transform: `translate3d(${translate}, 0, 0)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onTransitionEnd={handleTransitionEnd}
        >
          {trackSlides.map((banner, slideIndex) => (
            <div key={`${banner.href}-${banner.imageUrl}-${slideIndex}`} className="w-full shrink-0">
              <BannerLink banner={banner} isFirst={activeIndex === 0 && (slideIndex === 1 || slides.length === 1)} />
            </div>
          ))}
        </div>
      </div>
      {slides.length > 1 ? (
        <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
          {slides.map((slide, slideIndex) => (
            <button
              key={`${slide.href}-${slide.imageUrl}-${slideIndex}`}
              type="button"
              onClick={() => goToSlide(slideIndex)}
              className={`h-1.5 rounded-full transition-all ${slideIndex === activeIndex ? "w-5 bg-white" : "w-1.5 bg-white/60"}`}
              aria-label={`Go to banner ${slideIndex + 1}`}
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

  const className = "block w-full";
  const href = normalizeHref(banner);

  if (!href) {
    return image;
  }

  if (isExternalHref(href)) {
    const target = banner.openMode === "same" || banner.openMode === "external_same" ? undefined : "_blank";
    return (
      <a href={href} target={target} rel={target ? "noopener noreferrer" : undefined} className={className} aria-label={banner.title || "OpenAA banner"}>
        {image}
      </a>
    );
  }

  return (
    <Link href={href} className={className} aria-label={banner.title || "OpenAA banner"}>
      {image}
    </Link>
  );
}

function normalizeHref(banner: HomeBannerItem) {
  if ((banner.openMode === "internal" || banner.openMode === "same") && banner.slug) {
    return `/ads/${banner.slug}`;
  }

  return banner.href || "";
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}
