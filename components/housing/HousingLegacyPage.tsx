import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";
import { ALL_HOUSING_REGIONS, HOUSING_REGIONS, housingTabs, type HousingMode } from "@/features/housing/legacy";
import type { PostsQueryResult, PostCardView } from "@/features/posts/types";
import { HousingCard } from "./HousingCard";

type HousingLegacyPageProps = {
  result: PostsQueryResult<PostCardView[]>;
  mode: HousingMode;
  keyword: string;
  region: string;
};

function hrefFor(next: { mode?: HousingMode; keyword?: string; region?: string }) {
  const params = new URLSearchParams();
  params.set("type", next.mode ?? "renting");
  if (next.keyword) params.set("q", next.keyword);
  if (next.region && next.region !== ALL_HOUSING_REGIONS) params.set("region", next.region);
  return `/housing?${params.toString()}`;
}

export function HousingLegacyPage({ result, mode, keyword, region }: HousingLegacyPageProps) {
  const pageTitle = mode === "seeking" ? "求租求购" : "房屋租售";
  const publishLabel = mode === "seeking" ? "发布求租" : "发布房源";
  const searchPlaceholder = mode === "seeking" ? "搜索求租需求、地区、预算" : "搜索房源、地区、房型";

  return (
    <main className="mx-auto max-w-3xl px-4 py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-blue-700">Housing</p>
          <h1 className="text-2xl font-black text-slate-950">{pageTitle}</h1>
        </div>
        <Link href={`/housing/publish?type=${mode}`} className="shrink-0 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white">
          {publishLabel}
        </Link>
      </div>

      <nav className="mb-3 grid grid-cols-2 gap-2">
        {housingTabs.map((tab) => (
          <Link
            key={tab.key}
            href={hrefFor({ mode: tab.key, keyword, region })}
            className={tab.key === mode ? "rounded-lg bg-slate-950 px-3 py-2 text-center text-sm font-bold text-white" : "rounded-lg bg-slate-100 px-3 py-2 text-center text-sm font-bold text-slate-700"}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <form action="/housing" className="mb-4 space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <input type="hidden" name="type" value={mode} />
        <input
          name="q"
          defaultValue={keyword}
          placeholder={searchPlaceholder}
          className="min-h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400"
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
          <select name="region" defaultValue={region || ALL_HOUSING_REGIONS} className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400">
            {HOUSING_REGIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button type="submit" className="min-h-11 rounded-lg bg-slate-950 px-5 text-sm font-bold text-white">
            搜索
          </button>
        </div>
      </form>

      {result.error ? <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{result.error}</p> : null}

      <section className="space-y-3">
        {result.data.length > 0 ? (
          result.data.map((post) => <HousingCard key={post.id} post={post} />)
        ) : (
          <EmptyState title="暂无房屋信息" description="当前筛选下还没有信息，可以返回全部地区或发布房屋信息。" />
        )}
      </section>

      <section className="mt-6 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        <h2 className="font-black text-slate-950">纽约租房与华人房屋信息指南</h2>
        <p className="mt-2">可在房源信息与求租求购之间切换，并使用关键词、地区筛选纽约及周边房屋信息。</p>
      </section>
    </main>
  );
}
