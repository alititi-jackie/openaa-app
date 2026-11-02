"use client";

import { useEffect, useState } from "react";
import { getPostViewCount } from "@/features/posts/engagementActions";
import { formatViewCount } from "@/features/posts/display";

// Display only. The global page-view collector is the sole writer.
export function PostViewTracker({
  postId,
  initialViewCount,
  className,
}: {
  postId: string;
  initialViewCount: number;
  className?: string;
}) {
  const [result, setResult] = useState({ id: postId, count: initialViewCount });
  useEffect(() => {
    let active = true;
    let sequence = 0;
    async function refresh() {
      const current = ++sequence;
      try {
        const value = await getPostViewCount(postId);
        if (
          active &&
          current === sequence &&
          value.ok &&
          typeof value.viewCount === "number"
        )
          setResult({ id: postId, count: value.viewCount });
      } catch {
        /* Keep the last known count when offline. */
      }
    }
    void refresh();
    window.addEventListener("openaa:page-view-recorded", refresh);
    return () => {
      active = false;
      window.removeEventListener("openaa:page-view-recorded", refresh);
    };
  }, [postId]);
  if (!className) return null;
  return (
    <span className={className}>
      {formatViewCount(result.id === postId ? result.count : initialViewCount, {
        icon: true,
        unit: true,
      })}
    </span>
  );
}
