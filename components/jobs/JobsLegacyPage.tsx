import Link from "next/link";
import { ALL_JOB_REGIONS, JOB_CATEGORIES, JOB_LOCATIONS, JOB_TYPES, type JobListFilters } from "@/features/jobs/legacy";
import type { QueryState, PostCardView } from "@/features/posts/types";
import { JobCard } from "./JobCard";

type JobsLegacyPageProps = {
  filters: JobListFilters;
  posts: PostCardView[];
  queryState: QueryState;
  errorMessage?: string;
};

const tabs = [
  { key: "hiring", label: "招聘岗位" },
  { key: "seeking", label: "求职人才" },
] as const;

function queryHref(filters: JobListFilters, patch: Partial<JobListFilters>) {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (next.mode && next.mode !== "hiring") params.set("type", next.mode);
  if (next.search) params.set("q", next.search);
  if (next.jobType) params.set("job_type", next.jobType);
  if (next.category) params.set("category", next.category);
  if (next.location && next.location !== ALL_JOB_REGIONS) params.set("location", next.location);
  const query = params.toString();
  return query ? `/jobs?${query}` : "/jobs";
}

function optionList(values: readonly string[]) {
  return values.map((value) => (
    <option key={value} value={value}>
      {value}
    </option>
  ));
}

export function JobsLegacyPage({ filters, posts, queryState, errorMessage }: JobsLegacyPageProps) {
  const pageTitle = filters.mode === "seeking" ? "求职信息" : "招聘信息";
  const publishLabel = filters.mode === "seeking" ? "发布求职" : "发布职位";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-24">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link href="/" className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-100">
          ← 返回首页
        </Link>
        <button type="button" className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-100">
          分享
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        <Link href={`/jobs/publish?type=${filters.mode}`} className="rounded-lg bg-[#1976d2] px-4 py-2 text-sm text-white transition hover:bg-[#1565c0]">
          + {publishLabel}
        </Link>
      </div>

      <div className="mb-6 overflow-x-auto overflow-y-hidden py-1">
        <div className="inline-flex flex-nowrap rounded-xl bg-gray-100 p-1">
          {tabs.map((tab) => {
            const active = filters.mode === tab.key;
            return (
              <Link
                key={tab.key}
                href={queryHref(filters, { mode: tab.key })}
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
      </div>

      <form action="/jobs" className="mb-6 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
        <input type="hidden" name="type" value={filters.mode} />
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <input
            type="text"
            name="q"
            defaultValue={filters.search ?? ""}
            placeholder="搜索职位、公司、地点..."
            className="w-full flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1976d2] sm:min-w-48"
          />
          <select
            name="job_type"
            defaultValue={filters.jobType ?? ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1976d2] sm:w-auto"
          >
            <option value="">工作类型</option>
            {optionList(JOB_TYPES)}
          </select>
          <select
            name="category"
            defaultValue={filters.category ?? ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1976d2] sm:w-auto"
          >
            <option value="">职位分类</option>
            {optionList(JOB_CATEGORIES)}
          </select>
          <select
            name="location"
            defaultValue={filters.location ?? ALL_JOB_REGIONS}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1976d2] sm:w-auto"
          >
            <option value={ALL_JOB_REGIONS}>全部地区</option>
            {optionList(JOB_LOCATIONS)}
          </select>
          <button type="submit" className="rounded-lg bg-[#1976d2] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1565c0]">
            筛选
          </button>
        </div>
      </form>

      {queryState === "error" ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-800">内容读取暂时不可用：{errorMessage ?? "请稍后再试。"}</div>
      ) : queryState === "missing_config" ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <p className="font-medium text-gray-900">暂无相关信息</p>
          <p className="mt-2 text-sm text-gray-500">Supabase 环境变量尚未配置，当前无法读取公开招聘信息。</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mb-3 text-4xl">💼</div>
          <p className="font-medium text-gray-900">暂无相关信息</p>
          <p className="mt-2 text-sm text-gray-500">可以换个关键词或地区试试，也可以发布第一条信息。</p>
          <Link href="/jobs/publish" className="mt-4 inline-flex rounded-lg bg-[#1976d2] px-4 py-2 text-sm text-white transition hover:bg-[#1565c0]">
            发布招聘
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <JobCard key={post.id} job={post} />
          ))}
        </div>
      )}

      <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-5 text-sm leading-7 text-gray-600 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">纽约华人招聘与求职频道说明</h2>
        <p className="mt-3">
          OpenAA 招聘频道面向纽约和周边华人社区，覆盖纽约华人招聘、法拉盛找工作、兼职、全职、餐馆招聘、仓库配送、门店销售等常见岗位。
        </p>
        <p className="mt-3">你可以先按招聘岗位或求职人才切换，再结合关键词和地区过滤，快速定位合适的信息。</p>
      </section>
    </div>
  );
}
