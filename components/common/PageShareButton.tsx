"use client";

import { StatusToast, useStatusToast } from "./StatusToast";
import { type ReactNode } from "react";
import { canonicalUrl } from "@/lib/seo/siteConfig";
import { detailActionButtonClass } from "./detailActionStyles";

type PageShareButtonProps = {
  path: string;
  title: string;
  text: string;
  className?: string;
  label?: ReactNode;
  ariaLabel?: string;
};

function buildUrl(path: string) {
  return canonicalUrl(path);
}

export function PageShareButton({
  path,
  title,
  text,
  className,
  label = "分享",
  ariaLabel = "分享当前页面",
}: PageShareButtonProps) {
  const [toast, showToast] = useStatusToast();
  async function handleShare() {
    if (typeof navigator === "undefined") return;

    const url = buildUrl(path);
    const shareData = { title, text, url };

    if (navigator.share) {
      const shared = await navigator
        .share(shareData)
        .then(() => true)
        .catch(() => false);
      if (shared) return;
    }

    const copied = await navigator.clipboard
      ?.writeText(url)
      .then(() => true)
      .catch(() => false);
    showToast(
      copied ? "链接已复制，可以发送给朋友" : "复制失败，请手动复制链接",
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        aria-label={ariaLabel}
        className={className ?? detailActionButtonClass}
      >
        {label}
      </button>
      <StatusToast toast={toast} />
    </>
  );
}
