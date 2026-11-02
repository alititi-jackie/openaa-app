"use client";
import { useEffect, useState, useTransition } from "react";
import { updateNewsViewSettings } from "@/features/news/viewActions";
import type { NewsViewSettings as Settings } from "@/features/news/viewSettings";
export function NewsViewSettings({
  initial,
  available,
  canEdit,
}: {
  initial: Settings;
  available: boolean;
  canEdit: boolean;
}) {
  const [settings, setSettings] = useState(initial);
  const [message, setMessage] = useState(
    available ? "" : "设置暂不可用，请刷新后重试。",
  );
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 2500);
    return () => window.clearTimeout(timer);
  }, [saved]);
  const [pending, startTransition] = useTransition();
  function toggle(key: keyof Settings) {
    setSaved(false);
    setMessage("");
    const next = { ...settings, [key]: !settings[key] };
    startTransition(async () => {
      try {
        const result = await updateNewsViewSettings(next);
        if (result.ok) setSettings(next);
        setSaved(result.ok);
        setMessage(
          result.ok && result.message === "已保存" ? "" : result.message,
        );
      } catch {
        setMessage("保存失败，设置未改变，请重试。");
      }
    });
  }
  return (
    <section
      aria-label="前台阅读量设置"
      className="rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-sm sm:px-4"
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
        <div className="flex items-center gap-1">
          <h2 className="text-sm font-bold text-slate-950">前台阅读量</h2>
          <details className="group relative">
            <summary
              aria-label="阅读量设置说明"
              className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 [&::-webkit-details-marker]:hidden"
            >
              <span
                aria-hidden="true"
                className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-xs"
              >
                ?
              </span>
            </summary>
            <p className="absolute -left-24 top-full z-20 w-60 rounded-lg border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600 shadow-lg">
              仅控制前台显示，统计持续累计，后台始终可见。
            </p>
          </details>
          <span role="status" className="text-xs text-slate-500">
            {pending ? "保存中…" : saved ? "已保存" : ""}
          </span>
        </div>
        <div className="flex w-full items-center gap-5 sm:w-auto sm:gap-6">
          {(
            [
              ["detail", "详情页"],
              ["list", "列表页"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <span
                id={`news-views-${key}`}
                className="text-sm font-semibold text-slate-700"
              >
                {label}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={settings[key]}
                aria-label={`${label}显示浏览次数`}
                disabled={!available || !canEdit || pending}
                onClick={() => toggle(key)}
                className={`min-h-9 shrink-0 rounded-full px-3 py-1.5 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 ${settings[key] ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}
              >
                {settings[key] ? "开启" : "关闭"}
              </button>
            </div>
          ))}
        </div>
      </div>
      {!canEdit ? (
        <p className="mt-2 text-xs text-slate-500">
          需要新闻发布权限才能修改。
        </p>
      ) : null}
      {message ? (
        <p role="alert" className="mt-2 text-xs text-amber-700">
          {message}
        </p>
      ) : null}
    </section>
  );
}
