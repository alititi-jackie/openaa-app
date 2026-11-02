"use client";
import { useState, useTransition } from "react";
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
  const [pending, startTransition] = useTransition();
  function toggle(key: keyof Settings) {
    const next = { ...settings, [key]: !settings[key] };
    startTransition(async () => {
      try {
        const result = await updateNewsViewSettings(next);
        if (result.ok) setSettings(next);
        setMessage(result.message);
      } catch {
        setMessage("保存失败，设置未改变，请重试。");
      }
    });
  }
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">阅读量设置</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        关闭仅隐藏前台浏览次数，统计继续累计，后台始终可查看。
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {(
          [
            ["detail", "新闻详情页显示浏览次数"],
            ["list", "新闻列表显示浏览次数"],
          ] as const
        ).map(([key, label]) => (
          <div
            key={key}
            className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"
          >
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
              aria-labelledby={`news-views-${key}`}
              disabled={!available || !canEdit || pending}
              onClick={() => toggle(key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-bold disabled:opacity-50 ${settings[key] ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}
            >
              {settings[key] ? "开启" : "关闭"}
            </button>
          </div>
        ))}
      </div>
      {!canEdit ? (
        <p className="mt-2 text-xs text-slate-500">
          需要新闻发布权限才能修改。
        </p>
      ) : null}
      <p role="status" className="mt-2 text-xs text-slate-600">
        {pending ? "保存中…" : message}
      </p>
    </section>
  );
}
