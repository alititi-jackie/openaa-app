import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Minus, Plus } from "lucide-react";

export function HomeConfigPanel({
  title,
  description,
  summary,
  children,
}: {
  title: string;
  description?: string;
  summary: string[];
  children: ReactNode;
}) {
  return (
    <details className="group/home-config-panel rounded-2xl border border-slate-100 bg-white shadow-sm open:border-[#1976d2] [&>summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-4">
        <div className="min-w-0">
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          {description ? <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p> : null}
          <SummaryPills items={summary} className="mt-3" />
        </div>
        <span className="shrink-0 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white group-open/home-config-panel:hidden">展开编辑</span>
        <span className="hidden shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 group-open/home-config-panel:inline-flex">收起</span>
      </summary>
      <div className="border-t border-slate-100 p-4 pt-4">{children}</div>
    </details>
  );
}

export function NestedConfigPanel({
  title,
  summary,
  children,
  tone = "slate",
}: {
  title: string;
  summary: string[];
  children: ReactNode;
  tone?: "slate" | "blue";
}) {
  const toneClass = tone === "blue" ? "border-blue-100 bg-blue-50" : "border-slate-100 bg-slate-50";

  return (
    <details className={`group/nested-config-panel rounded-2xl border p-3 [&>summary::-webkit-details-marker]:hidden ${toneClass}`}>
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-900">{title}</p>
          <SummaryPills items={summary} className="mt-2" />
        </div>
        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200 group-open/nested-config-panel:hidden">展开</span>
        <span className="hidden shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200 group-open/nested-config-panel:inline-flex">收起</span>
      </summary>
      <div className="mt-3 border-t border-white/70 pt-3">{children}</div>
    </details>
  );
}

export function TickerItemConfigPanel({ title, summary, children }: { title: string; summary: string[]; children: ReactNode }) {
  return (
    <details className="group/ticker-item-panel rounded-2xl border border-slate-100 bg-slate-50 p-3 [&>summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-900">{title}</p>
          <SummaryPills items={summary} className="mt-2" />
        </div>
        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200 group-open/ticker-item-panel:hidden">展开</span>
        <span className="hidden shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200 group-open/ticker-item-panel:inline-flex">收起</span>
      </summary>
      <div className="mt-3 border-t border-white/70 pt-3">{children}</div>
    </details>
  );
}

function SummaryPills({ items, className = "" }: { items: string[]; className?: string }) {
  return items.length > 0 ? (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
          {item}
        </span>
      ))}
    </div>
  ) : null;
}

export function ConfigControlRow({
  title,
  isVisible,
  index,
  total,
  moveUpIntent,
  moveDownIntent,
  toggleIntent,
  decrementIntent,
  incrementIntent,
  count,
  countLabel,
  children,
}: {
  title: string;
  isVisible: boolean;
  index: number;
  total: number;
  moveUpIntent: string;
  moveDownIntent: string;
  toggleIntent: string;
  decrementIntent?: string;
  incrementIntent?: string;
  count?: number;
  countLabel?: string;
  children?: ReactNode;
}) {
  const statusText = countLabel ?? (typeof count === "number" ? `显示 ${count} 条` : "");

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      {children}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950">{title}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {isVisible ? "当前显示" : "当前隐藏"}
            {statusText ? ` · ${statusText}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <IconSubmitButton intent={moveUpIntent} disabled={index === 0} label={`${title}上移`}>
            <ArrowUp size={16} aria-hidden="true" />
          </IconSubmitButton>
          <IconSubmitButton intent={moveDownIntent} disabled={index === total - 1} label={`${title}下移`}>
            <ArrowDown size={16} aria-hidden="true" />
          </IconSubmitButton>
          {decrementIntent ? (
            <IconSubmitButton intent={decrementIntent} disabled={typeof count === "number" && count <= 1} label={`${title}减少显示数量`}>
              <Minus size={16} aria-hidden="true" />
            </IconSubmitButton>
          ) : null}
          {incrementIntent ? (
            <IconSubmitButton intent={incrementIntent} disabled={typeof count === "number" && count >= 20} label={`${title}增加显示数量`}>
              <Plus size={16} aria-hidden="true" />
            </IconSubmitButton>
          ) : null}
          <button
            type="submit"
            name="intent"
            value={toggleIntent}
            className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700"
          >
            {isVisible ? "隐藏" : "显示"}
          </button>
        </div>
      </div>
    </div>
  );
}

function IconSubmitButton({ intent, disabled, label, children }: { intent: string; disabled?: boolean; label: string; children: ReactNode }) {
  return (
    <button
      type="submit"
      name="intent"
      value={intent}
      disabled={disabled}
      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
      aria-label={label}
    >
      {children}
    </button>
  );
}
