"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

const OPENAA_SHARE_URL = "https://openaa.com/";
const OPENAA_SHARE_TITLE = "OpenAA 美国华人生活平台";

type ShareNavigator = Navigator & {
  share?: (data: ShareData) => Promise<void>;
};

async function copyShareUrl() {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(OPENAA_SHARE_URL);
    return true;
  }

  const textarea = document.createElement("textarea");
  textarea.value = OPENAA_SHARE_URL;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return copied;
}

export function ProfileShareButton() {
  const [toast, setToast] = useState("");

  function showToast(message: string, durationMs = 1800) {
    setToast(message);
    window.setTimeout(() => setToast(""), durationMs);
  }

  async function handleShare() {
    const nav = navigator as ShareNavigator;

    try {
      if (nav.share) {
        await nav.share({
          title: OPENAA_SHARE_TITLE,
          url: OPENAA_SHARE_URL,
        });
        return;
      }

      if (await copyShareUrl()) {
        showToast("链接已复制");
      }
    } catch {
      try {
        if (await copyShareUrl()) {
          showToast("链接已复制");
        }
      } catch {
        showToast("请手动复制：https://openaa.com/", 2400);
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        className="rounded-2xl border border-orange-100 bg-white p-3.5 text-left shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition active:scale-[0.98]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white shadow-sm">
              <Share2 size={17} className="text-orange-500" aria-hidden="true" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-bold leading-tight text-blue-600">OpenAA</div>
            <div className="mt-1 text-[13px] font-semibold leading-tight text-slate-900">分享给朋友</div>
          </div>
        </div>
      </button>

      {toast ? (
        <div className="fixed bottom-24 left-1/2 z-[110] -translate-x-1/2">
          <div className="rounded-full bg-zinc-900 px-4 py-2 text-[12px] font-semibold text-white shadow-lg">{toast}</div>
        </div>
      ) : null}
    </>
  );
}
