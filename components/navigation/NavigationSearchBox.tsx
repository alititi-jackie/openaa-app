import { Search } from "lucide-react";

export function NavigationSearchBox({ activeCategory, q }: { activeCategory?: string; q: string }) {
  return (
    <form action="/navigation" className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
      {activeCategory ? <input type="hidden" name="category" value={activeCategory} /> : null}
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
        <input
          name="q"
          defaultValue={q}
          placeholder="搜索常用网站、办事入口"
          className="min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-20 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white"
        />
        <button type="submit" className="absolute right-1.5 top-1/2 inline-flex min-h-8 -translate-y-1/2 items-center rounded-full bg-blue-600 px-4 text-xs font-black text-white transition hover:bg-blue-700">
          搜索
        </button>
      </label>
    </form>
  );
}
