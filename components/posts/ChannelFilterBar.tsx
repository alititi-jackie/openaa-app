import { Search, SlidersHorizontal } from "lucide-react";

export function ChannelFilterBar({ placeholder }: { placeholder: string }) {
  return (
    <section className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
      <label className="flex min-h-11 items-center gap-2 rounded-lg bg-slate-50 px-3 text-sm text-slate-500">
        <Search size={17} aria-hidden="true" />
        <input
          type="search"
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
        />
      </label>
      <div className="mt-3 flex gap-2">
        <button type="button" className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
          <SlidersHorizontal size={16} aria-hidden="true" />
          筛选
        </button>
        <button type="button" className="min-h-10 flex-1 rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
          最新优先
        </button>
      </div>
    </section>
  );
}
