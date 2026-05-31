"use client";

import Link from "next/link";
import { ArrowLeft, Share2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ChannelTopActionsProps = {
  path: string;
  title: string;
  text?: string;
  className?: string;
};

export function ChannelTopActions({ path, title, text, className }: ChannelTopActionsProps) {
  async function shareChannel() {
    const url = new URL(path, window.location.origin).toString();
    const shareData = {
      title,
      text: text ?? title,
      url,
    };

    if (navigator.share) {
      const shared = await navigator.share(shareData).then(() => true).catch(() => false);
      if (shared) return;
    }

    await navigator.clipboard?.writeText(url).catch(() => undefined);
  }

  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <Link
        href="/"
        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 shadow-sm"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        返回首页
      </Link>
      <button
        type="button"
        onClick={shareChannel}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 shadow-sm"
      >
        <Share2 size={16} aria-hidden="true" />
        分享
      </button>
    </div>
  );
}
