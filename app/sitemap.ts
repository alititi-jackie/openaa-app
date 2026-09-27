import type { MetadataRoute } from "next";
import { getSitemapContentEntries } from "@/features/seo/sitemapQueries";
import { canonicalUrl, staticSitemapRoutes } from "@/lib/seo/siteConfig";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const content = await getSitemapContentEntries().catch((error) => {
    console.error("[sitemap] content query failed", error);
    return [];
  });

  const staticRoutes: MetadataRoute.Sitemap = staticSitemapRoutes.map((route) => ({
    url: canonicalUrl(route),
    lastModified: now,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));

  return [
    ...staticRoutes,
    ...content.map((item) => ({
      url: canonicalUrl(item.href),
      lastModified: new Date(item.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.55,
    })),
  ];
}
