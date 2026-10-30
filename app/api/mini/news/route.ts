import { NextResponse } from "next/server";
import { getNewsBySlug, getNewsCategories, getPublishedNewsList } from "@/features/news/queries";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const slug = params.get("slug");
  const headers = { "Cache-Control": "no-store" };

  if (slug !== null) {
    if (!/^[a-z0-9][a-z0-9_-]{0,119}$/i.test(slug)) {
      return NextResponse.json({ state: "error", error: "invalid_slug" }, { status: 400, headers });
    }
    const result = await getNewsBySlug(slug);
    if (result.state !== "ready") {
      return NextResponse.json({ state: "error", error: "news_unavailable" }, { status: result.state === "missing_config" ? 503 : 500, headers });
    }
    if (!result.data) return NextResponse.json({ state: "ready", data: null }, { status: 404, headers });
    const post = result.data;
    return NextResponse.json({ state: "ready", data: {
      id: post.id, slug: post.slug, title: post.title, excerpt: post.excerpt,
      body: post.body, categoryName: post.categoryName, publishedAt: post.publishedAt,
      coverImageUrl: post.coverImageUrl,
    } }, { headers });
  }

  const category = params.get("category") || undefined;
  if (category && !/^[a-z0-9_-]{1,60}$/i.test(category)) {
    return NextResponse.json({ state: "error", error: "invalid_category" }, { status: 400, headers });
  }
  const [categories, posts] = await Promise.all([
    getNewsCategories(),
    getPublishedNewsList({ categorySlug: category, limit: 50 }),
  ]);
  if (categories.state !== "ready" || posts.state !== "ready") {
    return NextResponse.json({ state: "error", error: "news_unavailable" }, { status: categories.state === "missing_config" || posts.state === "missing_config" ? 503 : 500, headers });
  }
  return NextResponse.json({ state: "ready", data: {
    categories: categories.data.map(c => ({ slug: c.slug, name: c.name })),
    posts: posts.data.map(p => ({
      id: p.id, slug: p.slug, title: p.title, excerpt: p.excerpt,
      categoryName: p.categoryName, publishedAt: p.publishedAt,
      coverImageUrl: p.coverImageUrl, isPinned: p.isPinned,
    })),
  } }, { headers });
}
