import { Clock, Flame, Search } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "搜索",
  description: "搜索 OpenAA 招聘、房屋、二手市场、本地服务、新闻和 DMV 内容。",
  path: "/search",
  noIndex: true,
});

export default function SearchPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">搜索</h1>
        <label className="mt-4 flex min-h-12 items-center gap-2 rounded-xl bg-slate-50 px-3 text-sm text-slate-500">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            placeholder="搜索招聘、房屋、二手、服务、新闻"
            className="min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
          />
        </label>
      </section>
      <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-slate-700">
          <Clock size={18} aria-hidden="true" />
          <h2 className="font-black">搜索历史</h2>
        </div>
        <EmptyState title="暂无搜索历史" description="后续接入本地历史或登录用户搜索记录。" />
      </section>
      <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-orange-700">
          <Flame size={18} aria-hidden="true" />
          <h2 className="font-black">热门搜索</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {["租房", "兼职", "DMV", "搬家", "二手家具"].map((item) => (
            <button key={item} type="button" className="rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
              {item}
            </button>
          ))}
        </div>
      </section>
      <EmptyState title="搜索结果占位" description="本阶段不接搜索 API，后续会显示跨频道搜索结果。" icon={<Search size={20} aria-hidden="true" />} />
    </div>
  );
}
