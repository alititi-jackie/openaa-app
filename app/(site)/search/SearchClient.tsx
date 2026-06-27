"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DetailBackButton } from "@/components/common/DetailBackButton";
import { EmptyState } from "@/components/common/EmptyState";
import type { SearchQueryResult, SearchResultItem } from "@/features/search/types";

type SearchClientProps = {
  initialQuery?: string;
};

type SearchStatus = "idle" | "loading" | "ready" | "error";

type FeatureEntry = {
  value: string;
  label: string;
  href: string;
};

type FeatureGroup = {
  keywords: string[];
  entries: FeatureEntry[];
};

const FEATURE_GROUPS: FeatureGroup[] = [
  {
    keywords: ["驾照", "dmv", "permit", "笔试", "考试", "罚单"],
    entries: [
      { value: "dmv-home", label: "DMV首页", href: "/dmv" },
      { value: "dmv-questions", label: "DMV题库", href: "/dmv/questions" },
      { value: "dmv-practice", label: "DMV练习", href: "/dmv/practice" },
      { value: "dmv-mock", label: "模拟考试", href: "/dmv/mock-test" },
      { value: "dmv-wrong", label: "错题练习", href: "/dmv/wrong-questions" },
      { value: "dmv-tickets", label: "罚单查询", href: "/dmv/tickets" },
    ],
  },
  {
    keywords: ["招聘", "工作", "兼职", "求职"],
    entries: [
      { value: "jobs", label: "招聘信息", href: "/jobs" },
      { value: "jobs-publish", label: "发布招聘", href: "/jobs/publish" },
      { value: "job-seeking", label: "求职信息", href: "/jobs?mode=seeking" },
      { value: "my-jobs", label: "我的招聘", href: "/profile/posts?type=jobs" },
    ],
  },
  {
    keywords: ["房屋", "租房", "求租", "住房"],
    entries: [
      { value: "housing", label: "房屋信息", href: "/housing" },
      { value: "housing-publish", label: "发布房屋", href: "/housing/publish" },
      { value: "housing-seeking", label: "求租求购", href: "/housing?mode=seeking" },
      { value: "my-housing", label: "我的房屋", href: "/profile/posts?type=housing" },
    ],
  },
  {
    keywords: ["二手", "买卖", "家具", "求购"],
    entries: [
      { value: "marketplace", label: "二手交易", href: "/marketplace" },
      { value: "marketplace-publish", label: "发布二手", href: "/marketplace/publish" },
      { value: "marketplace-buying", label: "求购信息", href: "/marketplace?mode=buying" },
      { value: "my-marketplace", label: "我的二手", href: "/profile/posts?type=marketplace" },
    ],
  },
  {
    keywords: ["服务", "搬家", "装修", "清洁", "律师", "会计"],
    entries: [
      { value: "services", label: "本地服务", href: "/services" },
      { value: "services-publish", label: "发布服务", href: "/services/publish" },
      { value: "my-services", label: "我的服务", href: "/profile/posts?type=services" },
    ],
  },
  {
    keywords: ["导航", "网站", "收藏"],
    entries: [
      { value: "navigation", label: "网站导航", href: "/navigation" },
      { value: "my-navigation", label: "我的导航", href: "/navigation/my" },
    ],
  },
  {
    keywords: ["新闻", "资讯"],
    entries: [{ value: "news", label: "新闻资讯", href: "/news" }],
  },
];

const FALLBACK_FEATURE_ENTRIES: FeatureEntry[] = [
  { value: "jobs", label: "招聘信息", href: "/jobs" },
  { value: "housing", label: "房屋信息", href: "/housing" },
  { value: "marketplace", label: "二手交易", href: "/marketplace" },
  { value: "services", label: "本地服务", href: "/services" },
  { value: "dmv-home", label: "DMV首页", href: "/dmv" },
  { value: "navigation", label: "网站导航", href: "/navigation" },
];

export default function SearchClient({ initialQuery = "" }: SearchClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<SearchStatus>(initialQuery.trim() ? "loading" : "idle");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [message, setMessage] = useState("");
  const trimmedQuery = useMemo(() => query.trim(), [query]);
  const featureEntries = useMemo(() => getFeatureEntries(trimmedQuery), [trimmedQuery]);

  useEffect(() => {
    if (!trimmedQuery) {
      const resetTimer = window.setTimeout(() => {
        setStatus("idle");
        setResults([]);
        setMessage("");
      }, 0);

      return () => window.clearTimeout(resetTimer);
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setStatus("loading");
      setMessage("");

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}&limit=8`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as SearchQueryResult;

        if (!response.ok || payload.state === "error" || payload.state === "missing_config") {
          setStatus("error");
          setResults([]);
          setMessage(payload.error || "搜索暂时不可用，请稍后再试。");
          return;
        }

        setStatus("ready");
        setResults(payload.data);
      } catch (error) {
        if (controller.signal.aborted) return;
        setStatus("error");
        setResults([]);
        setMessage(error instanceof Error ? error.message : "搜索暂时不可用，请稍后再试。");
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedQuery]);

  return (
    <div className="space-y-4">
      <div>
        <DetailBackButton />
      </div>
      <label className="flex min-h-12 items-center gap-2 rounded-xl bg-slate-50 px-3 text-sm text-slate-500">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索招聘、房屋、二手、服务、新闻"
          className="min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
        />
      </label>
      {trimmedQuery ? <FeatureEntryBar entries={featureEntries} /> : null}
      {trimmedQuery ? <SearchResults query={trimmedQuery} status={status} results={results} message={message} /> : null}
    </div>
  );
}

function getFeatureEntries(query: string): FeatureEntry[] {
  const normalized = query.toLowerCase();
  const entries = FEATURE_GROUPS.filter((group) => group.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))).flatMap((group) => group.entries);
  const uniqueEntries = uniqueByValue(entries);
  return uniqueEntries.length > 0 ? uniqueEntries : FALLBACK_FEATURE_ENTRIES;
}

function uniqueByValue(entries: FeatureEntry[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.value)) return false;
    seen.add(entry.value);
    return true;
  });
}

function FeatureEntryBar({ entries }: { entries: FeatureEntry[] }) {
  return (
    <nav aria-label="相关功能入口" className="max-w-full overflow-x-auto overflow-y-hidden whitespace-nowrap py-1 [touch-action:pan-x] [overscroll-behavior-x:contain] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex flex-nowrap items-center gap-2">
        {entries.map((entry) => (
          <Link key={entry.value} href={entry.href} className="inline-flex min-h-8 flex-shrink-0 items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium leading-none text-gray-600 transition hover:bg-gray-50">
            {entry.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function SearchResults({ query, status, results, message }: { query: string; status: SearchStatus; results: SearchResultItem[]; message: string }) {
  if (status === "loading") {
    return <EmptyState title="搜索中" description={`正在搜索“${query}”`} icon={<Search size={20} aria-hidden="true" />} />;
  }

  if (status === "error") {
    return <EmptyState title="搜索失败" description={message || "搜索暂时不可用，请稍后再试。"} icon={<Search size={20} aria-hidden="true" />} />;
  }

  if (results.length === 0) {
    return <EmptyState title="暂无搜索结果" description={`没有找到与“${query}”相关的内容。`} icon={<Search size={20} aria-hidden="true" />} />;
  }

  return (
    <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-slate-700">
        <Search size={18} aria-hidden="true" />
        <h2 className="font-black">搜索结果</h2>
      </div>
      <div className="space-y-2">
        {results.map((item) => (
          <SearchResultLink key={`${item.type}-${item.id}`} item={item} />
        ))}
      </div>
    </section>
  );
}

function SearchResultLink({ item }: { item: SearchResultItem }) {
  const className = "block rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 transition hover:bg-blue-50";
  const content = (
    <>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-black text-blue-700">{item.label}</span>
        {item.meta ? <span className="truncate text-xs text-slate-400">{item.meta}</span> : null}
      </div>
      <h3 className="mt-1 line-clamp-1 text-sm font-black text-slate-950">{item.title}</h3>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{item.description}</p>
    </>
  );

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  );
}
