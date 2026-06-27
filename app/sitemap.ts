import type { MetadataRoute } from "next";
import { getLatestNews } from "@/features/news/queries";
import { getPublicPostSitemapEntries } from "@/features/posts/queries";
import { canonicalUrl, staticSitemapRoutes } from "@/lib/seo/siteConfig";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [news, posts] = await Promise.all([
    getLatestNews(100).catch(() => ({ state: "error" as const, data: [] })),
    getPublicPostSitemapEntries(500).catch(() => ({ state: "error" as const, data: [] })),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = staticSitemapRoutes.map((route) => ({
    url: canonicalUrl(route),
    lastModified: now,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));

  return [
    ...staticRoutes,
    ...(news.state === "ready" ? news.data : []).map((post) => ({
      url: canonicalUrl(post.href),
      lastModified: new Date(post.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...(posts.state === "ready" ? posts.data : []).map((post) => ({
      url: canonicalUrl(post.href),
      lastModified: new Date(post.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.55,
    })),
  ];
}
