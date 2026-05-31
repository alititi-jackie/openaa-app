"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Search, Share2 } from "lucide-react";

export function Header() {
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
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] shadow-sm backdrop-blur">
      <div className="flex h-14 items-center gap-3">
        <Link href="/" className="flex min-w-0 flex-1 items-center gap-2" aria-label="OpenAA 首页">
          <Image
            src="/openaa-logo.png"
            alt="OpenAA"
            width={92}
            height={32}
            className="h-8 w-auto"
            priority
          />
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            <MapPin size={13} aria-hidden="true" />
            纽约
          </span>
        </Link>

        <Link
          href="/search"
          className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-700"
          aria-label="搜索"
        >
          <Search size={18} aria-hidden="true" />
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
    </header>
  );
}
