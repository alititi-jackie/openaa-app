"use client";

import { useEffect } from "react";
import { recordPostView } from "@/features/posts/engagementActions";

export function PostViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    const viewedKey = `openaa:viewed:${postId}`;
    if (window.localStorage.getItem(viewedKey)) return;

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
        }
      })
      .catch(() => undefined);
  }, [postId]);

  return null;
}
