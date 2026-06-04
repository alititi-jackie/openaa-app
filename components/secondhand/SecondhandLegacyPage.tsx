import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";
import {
  ALL_SECONDHAND_REGIONS,
  SECONDHAND_CATEGORIES,
  SECONDHAND_REGIONS,
  secondhandTabs,
  type SecondhandMode,
} from "@/features/secondhand/legacy";
import type { PostCardView, PostsQueryResult } from "@/features/posts/types";
import { SecondhandCard } from "./SecondhandCard";

type SecondhandLegacyPageProps = {
  result: PostsQueryResult<PostCardView[]>;
  mode: SecondhandMode;
  keyword: string;
  category: string;
  region: string;
  basePath?: "/secondhand" | "/marketplace";
};

function hrefFor(basePath: string, next: { mode?: SecondhandMode; keyword?: string; category?: string; region?: string }) {
  const params = new URLSearchParams();
  params.set("type", next.mode ?? "selling");
  if (next.keyword) params.set("q", next.keyword);
  if (next.category) params.set("category", next.category);
  if (next.region && next.region !== ALL_SECONDHAND_REGIONS) params.set("region", next.region);
  return `${basePath}?${params.toString()}`;
}

export function SecondhandLegacyPage({ result, mode, keyword, category, region, basePath = "/secondhand" }: SecondhandLegacyPageProps) {
  const pageTitle = mode === "buying" ? "求购信息" : "二手交易";
  const publishLabel = mode === "buying" ? "发布求购" : "发布商品";
  const searchPlaceholder = mode === "buying" ? "搜索求购..." : "搜索商品...";

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 pb-24">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        <Link href={`/secondhand/publish?type=${mode}`} className="rounded-lg bg-[#1976d2] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1565c0]">
          + {publishLabel}
        </Link>
      </div>

      <nav className="mb-6 overflow-x-auto overflow-y-hidden py-1">
        <div className="inline-flex flex-nowrap rounded-xl bg-gray-100 p-1">
          {secondhandTabs.map((tab) => {
            const active = tab.key === mode;
            return (
              <Link
                key={tab.key}
                href={hrefFor(basePath, { mode: tab.key, keyword, category, region })}
                className={
                  active
                    ? "inline-flex min-h-9 items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold leading-none text-gray-900 shadow-sm"
                    : "inline-flex min-h-9 items-center rounded-lg px-4 py-2 text-sm font-semibold leading-none text-gray-600 hover:text-gray-900"
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <form action={basePath} className="mb-6 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
        <input type="hidden" name="type" value={mode} />
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <input
            name="q"
            defaultValue={keyword}
            placeholder={searchPlaceholder}
            className="w-full flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-[#1976d2] sm:min-w-[12rem]"
          />
          <select name="category" defaultValue={category} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-[#1976d2] sm:w-auto">
            <option value="">不限</option>
            {SECONDHAND_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select name="region" defaultValue={region || ALL_SECONDHAND_REGIONS} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-[#1976d2] sm:w-auto">
            {SECONDHAND_REGIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-lg bg-slate-950 px-5 py-2 text-sm font-semibold text-white">
            搜索
          </button>
        </div>
      </form>

      {result.error ? <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{result.error}</p> : null}

      {result.data.length > 0 ? (
        <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {result.data.map((post) => (
            <SecondhandCard key={post.id} post={post} />
          ))}
        </section>
      ) : (
        <EmptyState title="暂无相关信息" description="可以换个关键词或地区试试，也可以发布第一条信息。" />
      )}

      <section className="mt-8 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        <h2 className="font-bold text-slate-950">纽约华人二手交易频道使用说明</h2>
        <p className="mt-2">OpenAA 二手频道聚焦纽约二手与本地闲置流通，支持出售/求购切换、分类筛选、地区筛选和关键词搜索。</p>
      </section>
    </main>
  );
}
