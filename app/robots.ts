import type { MetadataRoute } from "next";
import { canonicalUrl, noindexRoutePrefixes } from "@/lib/seo/siteConfig";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: noindexRoutePrefixes,
    },
    sitemap: canonicalUrl("/sitemap.xml"),
  };
}
