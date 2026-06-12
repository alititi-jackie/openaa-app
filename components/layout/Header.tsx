"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronUp, MapPin, Search, Share2 } from "lucide-react";
import { useState } from "react";
import { getFallbackTopQuickLinks, type TopQuickLink } from "@/features/navigation/topQuickLinks";
import { CityQuickLinks } from "./CityQuickLinks";

export function Header({ quickLinks = getFallbackTopQuickLinks("ny") }: { quickLinks?: TopQuickLink[] }) {
  const [quickLinksOpen, setQuickLinksOpen] = useState(false);
  const ChevronIcon = quickLinksOpen ? ChevronUp : ChevronDown;

  async function shareApp() {
    const shareData = {
      title: "OpenAA",
      text: "OpenAA 纽约华人生活信息平台",
      url: window.location.origin,
    };

    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    await navigator.clipboard?.writeText(shareData.url);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 pt-[max(0.75rem,env(safe-area-inset-top))] shadow-sm backdrop-blur">
      <div className="relative flex h-14 items-center justify-between px-4">
        <button
          type="button"
          aria-expanded={quickLinksOpen}
          aria-controls="city-quick-links"
          onClick={() => setQuickLinksOpen((current) => !current)}
          className="z-10 inline-flex min-h-10 shrink-0 items-center gap-1 rounded-full px-1 text-sm font-bold text-slate-700 active:opacity-70"
        >
          <MapPin size={14} className="text-blue-600" aria-hidden="true" />
          <span>纽约</span>
          <ChevronIcon size={15} className="text-blue-600" aria-hidden="true" />
        </button>

        <Link href="/" className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1.5" aria-label="OpenAA 首页">
          <Image src="/openaa-logo.png" alt="OpenAA" width={36} height={36} className="h-9 w-9 rounded-xl object-contain" priority />
          <span className="text-[20px] font-black leading-none tracking-normal">
            <span className="text-blue-600">Open</span>
            <span className="text-slate-900">AA</span>
          </span>
        </Link>

        <div className="z-10 flex shrink-0 items-center gap-2">
          <Link
            href="/search"
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-700"
            aria-label="搜索"
          >
            <Search size={20} aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={shareApp}
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-700"
            aria-label="分享"
          >
            <Share2 size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {quickLinksOpen ? (
        <div id="city-quick-links">
          <CityQuickLinks links={quickLinks} onNavigate={() => setQuickLinksOpen(false)} />
        </div>
      ) : null}
    </header>
  );
}
