import type { Metadata } from "next";
import { canonicalUrl, siteConfig } from "./siteConfig";

type BuildMetadataInput = {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
};

export function buildPageMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  noIndex = false,
}: BuildMetadataInput): Metadata {
  const url = canonicalUrl(path);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      type: "website",
      locale: siteConfig.locale,
      images: [
        {
          url: "/og-default.png",
          width: 1200,
          height: 630,
          alt: "OpenAA",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-default.png"],
    },
  };
}
