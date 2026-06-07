"use client";

import { ChevronRight, Share2 } from "lucide-react";
import { DetailShareButton } from "./DetailShareButton";

type DetailShareCardProps = {
  path: string;
  title: string;
  text: string;
  className?: string;
  hint?: string;
};

const defaultClassName =
  "group mt-4 flex w-full items-center rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-sky-50 p-4 text-left shadow-sm transition-all duration-200 hover:shadow-[0_12px_28px_rgba(15,23,42,0.12)] active:scale-[0.99]";

export function DetailShareCard({ path, title, text, className, hint = "一键调用系统分享，不支持时会自动复制链接" }: DetailShareCardProps) {
  return (
    <DetailShareButton
      path={path}
      title={title}
      text={text}
      className={className ? `${defaultClassName} ${className}` : defaultClassName}
      label={
        <span className="flex w-full items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-blue-100">
            <Share2 size={18} className="text-blue-600" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold leading-tight text-slate-900">分享给朋友</span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">{hint}</span>
          </span>
          <span className="shrink-0 text-blue-400 transition-transform duration-200 group-hover:translate-x-0.5">
            <ChevronRight size={18} aria-hidden="true" />
          </span>
        </span>
      }
    />
  );
}
