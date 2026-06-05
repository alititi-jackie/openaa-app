import { Search, SlidersHorizontal } from "lucide-react";

export function ChannelFilterBar({ placeholder }: { placeholder: string }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
      <label className="flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm text-gray-500 focus-within:border-transparent focus-within:ring-2 focus-within:ring-[#1976d2]">
        <Search size={17} aria-hidden="true" />
        <input type="search" placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-base text-gray-900 outline-none placeholder:text-gray-400" />
      </label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button type="button" className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 sm:flex-none">
          <SlidersHorizontal size={16} aria-hidden="true" />
          筛选
        </button>
        <button type="button" className="min-h-10 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 sm:flex-none">最新优先</button>
      </div>
    </section>
  );
}
