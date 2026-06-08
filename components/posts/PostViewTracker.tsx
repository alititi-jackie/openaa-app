"use client";

import { useEffect, useState } from "react";
import { getPostViewCount, recordPostView } from "@/features/posts/engagementActions";

const VIEW_DEDUPE_MS = 30 * 60 * 1000;

type PostViewTrackerProps = {
  postId: string;
  initialViewCount: number;
  className?: string;
};

function recentViewExists(value: string | null) {
  if (!value) return false;
  const viewedAt = new Date(value).getTime();
  return Number.isFinite(viewedAt) && Date.now() - viewedAt < VIEW_DEDUPE_MS;
}

export function PostViewTracker({ postId, initialViewCount, className }: PostViewTrackerProps) {
  const [viewCount, setViewCount] = useState(initialViewCount);

  useEffect(() => {
    const viewedKey = `openaa:viewed:${postId}`;
    if (recentViewExists(window.localStorage.getItem(viewedKey))) {
      getPostViewCount(postId)
        .then((result) => {
          if (result.ok && typeof result.viewCount === "number") {
            setViewCount(result.viewCount);
          }
        })
        .catch(() => undefined);
      return;
    }

    const visitorKey = "openaa:visitor_id";
    let visitorId = window.localStorage.getItem(visitorKey);
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      window.localStorage.setItem(visitorKey, visitorId);
    }

    recordPostView(postId, visitorId)
      .then((result) => {
        if (result.ok) {
          window.localStorage.setItem(viewedKey, new Date().toISOString());
          if (typeof result.viewCount === "number") {
            setViewCount(result.viewCount);
          }
        }
      })
      .catch(() => undefined);
  }, [postId]);

  if (!className) return null;

  return <span className={className}>👁 {viewCount} 次浏览</span>;
}
