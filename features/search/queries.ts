import "server-only";

import { getPublicNavigationLinks } from "@/features/navigation/queries";
import type { NavigationLink } from "@/features/navigation/types";
import { searchPublishedNews } from "@/features/news/queries";
import type { NewsPostCard } from "@/features/news/types";
import { searchPublicPosts } from "@/features/posts/queries";
import type { PostCardView, PostType, QueryState } from "@/features/posts/types";
import type { SearchQueryResult, SearchResultItem, SearchResultType } from "./types";

const CHANNELS: Record<SearchResultType, boolean> = {
  jobs: true,
  housing: true,
  secondhand: true,
  services: true,
  news: true,
  navigation: true,
};

const POST_TYPE_META: Record<PostType, { type: SearchResultType; label: string }> = {
  job: { type: "jobs", label: "招聘" },
  housing: { type: "housing", label: "房屋" },
  marketplace: { type: "secondhand", label: "二手" },
  service: { type: "services", label: "服务" },
};

function sanitizeSearchTerm(value: string) {
  return value.trim().replace(/[%,()]/g, " ").replace(/\s+/g, " ").slice(0, 80);
}

function normalizeLimit(value?: number) {
  if (!value || !Number.isFinite(value)) return 8;
  return Math.min(20, Math.max(1, Math.floor(value)));
}

function mergeState(states: QueryState[]): QueryState {
  if (states.every((state) => state === "error")) return "error";
  if (states.every((state) => state === "missing_config")) return "missing_config";
  return "ready";
}

async function withTimeout<T extends { state: QueryState; data: unknown; error?: string }>(promise: Promise<T>, source: string, timeoutMs = 8000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      resolve({ state: "error", data: [], error: `${source} search timed out` } as T);
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function postToSearchResult(post: PostCardView): SearchResultItem {
  const meta = POST_TYPE_META[post.type];
  return {
    id: post.id,
    type: meta.type,
    label: meta.label,
    title: post.title,
    description: post.description || post.displayBody || "",
    href: post.href,
    meta: [post.area, post.categoryValue, post.meta].filter(Boolean).join(" · "),
  };
}

function newsToSearchResult(post: NewsPostCard): SearchResultItem {
  return {
    id: post.id,
    type: "news",
    label: "新闻",
    title: post.title,
    description: post.excerpt,
    href: post.href,
    meta: [post.categoryName, post.publishedAt?.slice(0, 10)].filter(Boolean).join(" · "),
  };
}

function navigationToSearchResult(link: NavigationLink): SearchResultItem {
  return {
    id: link.id,
    type: "navigation",
    label: "导航",
    title: link.title,
    description: link.description || link.url,
    href: link.url,
    meta: link.categoryName,
    external: link.openMode === "new" || /^https?:\/\//i.test(link.url),
  };
}

export async function searchAllPublicContent(params: { q?: string; limit?: number } = {}): Promise<SearchQueryResult> {
  const q = sanitizeSearchTerm(params.q ?? "");
  if (!q) {
    return { state: "ready", data: [], channels: CHANNELS };
  }

  const limit = normalizeLimit(params.limit);
  const [posts, news, navigation] = await Promise.all([
    withTimeout(searchPublicPosts({ q, limit: limit * 4 }), "posts"),
    withTimeout(searchPublishedNews({ q, limit }), "news"),
    withTimeout(getPublicNavigationLinks({ q, limit }), "navigation"),
  ]);

  const data = [
    ...posts.data.slice(0, limit * 4).map(postToSearchResult),
    ...news.data.slice(0, limit).map(newsToSearchResult),
    ...navigation.data.slice(0, limit).map(navigationToSearchResult),
  ];

  return {
    state: mergeState([posts.state, news.state, navigation.state]),
    data,
    error: posts.error ?? news.error ?? navigation.error,
    channels: CHANNELS,
  };
}
