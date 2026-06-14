"use client";

import { useRouter } from "next/navigation";
import type { PostType } from "@/features/posts/types";
import type { NewsCategory } from "@/features/news/types";

export function PostRecycleBinTypeSelect({ value, filter, options }: { value: PostType | "all"; filter: string; options: Array<{ value: PostType; label: string }> }) {
  const router = useRouter();

  return (
    <select
      value={value}
      onChange={(event) => {
        const params = new URLSearchParams({ tab: "post" });
        if (event.target.value !== "all") params.set("type", event.target.value);
        if (filter && filter !== "all") params.set("filter", filter);
        router.push(`/admin/recycle-bin?${params.toString()}`);
      }}
      className="min-h-9 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 outline-none focus:border-blue-500"
      aria-label="用户发布类型"
    >
      <option value="all">全部类型</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function NewsRecycleBinCategorySelect({ value, filter, categories }: { value: string; filter: string; categories: NewsCategory[] }) {
  const router = useRouter();

  return (
    <select
      value={value}
      onChange={(event) => {
        const params = new URLSearchParams({ tab: "news" });
        if (event.target.value !== "all") params.set("category", event.target.value);
        if (filter && filter !== "all") params.set("filter", filter);
        router.push(`/admin/recycle-bin?${params.toString()}`);
      }}
      className="min-h-9 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 outline-none focus:border-blue-500"
      aria-label="新闻分类"
    >
      <option value="all">全部分类</option>
      {categories.flatMap((category) =>
        category.slug
          ? [
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>,
            ]
          : [],
      )}
    </select>
  );
}
