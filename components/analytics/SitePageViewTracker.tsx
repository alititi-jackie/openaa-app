"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISITOR_ID_KEY = "openaa:visitor_id";
const PAGE_VIEW_DEDUPE_PREFIX = "openaa:page_view:";
const PAGE_VIEW_DEDUPE_MS = 30 * 1000;

export function SitePageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || shouldSkipPath(pathname)) return;

    const now = Date.now();
    const dedupeKey = `${PAGE_VIEW_DEDUPE_PREFIX}${pathname}`;
    const lastRecordedAt = Number(window.sessionStorage.getItem(dedupeKey) ?? 0);
    if (Number.isFinite(lastRecordedAt) && now - lastRecordedAt < PAGE_VIEW_DEDUPE_MS) return;

    const visitorId = ensureVisitorId();
    window.sessionStorage.setItem(dedupeKey, String(now));

    fetch("/api/analytics/page-view", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        title: document.title,
        visitor_id: visitorId,
        referrer: document.referrer || null,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}

function ensureVisitorId() {
  let visitorId = window.localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    window.localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}

function shouldSkipPath(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next")
  );
}
