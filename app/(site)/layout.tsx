import type { ReactNode } from "react";
import { BackToTopButton } from "@/components/BackToTopButton";
import { AppShell } from "@/components/layout/AppShell";
import { canonicalUrl, siteConfig } from "@/lib/seo/siteConfig";

export default function SiteLayout({ children }: { children: ReactNode }) {
  const siteJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": canonicalUrl("/#organization"),
        name: siteConfig.name,
        url: canonicalUrl("/"),
        logo: canonicalUrl("/openaa-logo.png"),
      },
      {
        "@type": "WebSite",
        "@id": canonicalUrl("/#website"),
        name: siteConfig.name,
        url: canonicalUrl("/"),
        publisher: {
          "@id": canonicalUrl("/#organization"),
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${canonicalUrl("/search")}?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
      <AppShell>{children}</AppShell>
      <BackToTopButton />
    </>
  );
}
