"use client";

import Link from "next/link";
import { Clock, Flame, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DetailBackButton } from "@/components/common/DetailBackButton";
import { EmptyState } from "@/components/common/EmptyState";
import type { SearchQueryResult, SearchResultItem } from "@/features/search/types";

type SearchClientProps = {
  initialQuery?: string;
};

type SearchStatus = "idle" | "loading" | "ready" | "error";

const HOT_KEYWORDS = ["租房", "兼职", "DMV", "搬家", "二手家具"];

export default function SearchClient({ initialQuery = "" }: SearchClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<SearchStatus>(initialQuery.trim() ? "loading" : "idle");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [message, setMessage] = useState("");
  const trimmedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (!trimmedQuery) {
      setStatus("idle");
      setResults([]);
      setMessage("");
      return;
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
      <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">搜索</h1>
        <label className="mt-4 flex min-h-12 items-center gap-2 rounded-xl bg-slate-50 px-3 text-sm text-slate-500">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
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
          {HOT_KEYWORDS.map((item) => (
            <button key={item} type="button" onClick={() => setQuery(item)} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
              {item}
            </button>
          ))}
        </div>
      </section>
      <SearchResults query={trimmedQuery} status={status} results={results} message={message} />
    </div>
  );
}

function SearchResults({ query, status, results, message }: { query: string; status: SearchStatus; results: SearchResultItem[]; message: string }) {
  if (!query) {
    return <EmptyState title="搜索结果占位" description="输入关键词后会显示招聘、房屋、二手、服务、新闻和导航结果。" icon={<Search size={20} aria-hidden="true" />} />;
  }

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
