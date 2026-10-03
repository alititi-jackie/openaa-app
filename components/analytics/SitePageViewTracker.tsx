"use client";

import Script from "next/script";

export function SitePageViewTracker() {
  return <Script src="/analytics/tracker.js" strategy="afterInteractive" />;
}
