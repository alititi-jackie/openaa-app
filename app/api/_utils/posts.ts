import { NextResponse } from "next/server";
import { normalizePublicPostFilters } from "@/features/posts/filters";
import { getPublicPosts, searchPublicPosts } from "@/features/posts/queries";
import type { PostType, PostsQueryResult } from "@/features/posts/types";

const postTypes = new Set<PostType>(["job", "housing", "marketplace", "service"]);

export function readLimit(request: Request, fallback = 12) {
  const url = new URL(request.url);
  const parsed = Number(url.searchParams.get("limit") ?? fallback);
  return Number.isFinite(parsed) ? Math.min(50, Math.max(1, Math.floor(parsed))) : fallback;
}

export function readPostType(request: Request) {
  const url = new URL(request.url);
  const value = url.searchParams.get("type");
  return value && postTypes.has(value as PostType) ? (value as PostType) : undefined;
}

export function postsJson<T>(result: PostsQueryResult<T>) {
  if (result.state === "missing_config") {
    return NextResponse.json({ state: result.state, data: result.data, error: "missing_config" }, { status: 503 });
  }

  if (result.state === "error") {
    return NextResponse.json({ state: result.state, data: result.data, error: result.error ?? "请求失败，请稍后再试。" }, { status: 500 });
  }

  return NextResponse.json({ state: result.state, data: result.data, pagination: result.pagination });
}

export async function publicPostsResponse(type: PostType, request: Request) {
  const url = new URL(request.url);
  return postsJson(await getPublicPosts({ type, filters: normalizePublicPostFilters(url.searchParams) }));
}

export async function searchPostsResponse(request: Request) {
  const url = new URL(request.url);
  return postsJson(
    await searchPublicPosts({
      q: url.searchParams.get("q") ?? "",
      type: readPostType(request),
      limit: readLimit(request),
    }),
  );
}
