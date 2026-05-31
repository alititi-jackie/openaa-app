import type { MetadataRoute } from "next";
import { canonicalUrl, staticSitemapRoutes } from "@/lib/seo/siteConfig";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return staticSitemapRoutes.map((route) => ({
    url: canonicalUrl(route),
    lastModified: now,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
