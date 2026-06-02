"use client";

import Link from "next/link";
import { ChevronRight, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_TICKER_INTERVAL_MS = 4000;
const SWIPE_THRESHOLD = 40;

export function LatestTicker({
  items,
  intervalSeconds,
  enabled = true,
}: {
  items: Array<{ label: string; href: string }>;
  intervalSeconds?: number;
  enabled?: boolean;
}) {
  const intervalMs = normalizeIntervalMs(intervalSeconds);
  const tickerItems = items.length > 0 ? items : [{ label: "OpenAA 最新发布，点击右上角放大镜搜索更多内容", href: "/news" }];
  const [index, setIndex] = useState(0);
  const timerRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const didSwipeRef = useRef(false);
  const item = tickerItems[index] ?? tickerItems[0];

  const restartTimer = useCallback((count: number) => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (!enabled || count <= 1) return;
    timerRef.current = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, intervalMs);
  }, [enabled, intervalMs]);

  useEffect(() => {
    restartTimer(tickerItems.length);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [restartTimer, tickerItems.length]);

  function handleTouchStart(event: React.TouchEvent) {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
    didSwipeRef.current = false;
  }

  function handleTouchEnd(event: React.TouchEvent) {
    const startX = touchStartXRef.current;
    const endX = event.changedTouches[0]?.clientX ?? null;
    touchStartXRef.current = null;
    if (startX === null || endX === null || tickerItems.length <= 1) return;

    const deltaX = endX - startX;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;

    didSwipeRef.current = true;
    setIndex((current) => (deltaX < 0 ? (current + 1) % tickerItems.length : (current - 1 + tickerItems.length) % tickerItems.length));
    restartTimer(tickerItems.length);
  }

  function handleClick(event: React.MouseEvent) {
    if (!didSwipeRef.current) return;
    event.preventDefault();
    didSwipeRef.current = false;
  }

  if (!enabled) {
    return null;
  }

  return (
    <section className="min-w-0">
      <Link
        href={item.href}
        className="flex h-11 min-w-0 items-center rounded-full border border-zinc-100 bg-zinc-50 pl-4 pr-3 text-sm text-zinc-600 shadow-sm transition-colors hover:bg-zinc-100"
        aria-label={`查看最新动态：${item.label}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        <Zap size={15} className="mr-2 shrink-0 text-blue-400" aria-hidden="true" />
        <span className="flex-1 truncate font-medium">{item.label}</span>
        <ChevronRight size={14} className="ml-1 shrink-0 text-zinc-400" aria-hidden="true" />
      </Link>
    </section>
  );
}

function normalizeIntervalMs(value?: number) {
  if (!value || !Number.isFinite(value)) return DEFAULT_TICKER_INTERVAL_MS;
  return Math.min(10, Math.max(3, Math.trunc(value))) * 1000;
}
