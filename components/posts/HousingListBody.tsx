"use client";

import { useEffect, useRef, useState } from "react";
import { CONTACT_SOURCE_HINT_TEXT } from "./ContactSourceHint";

type HousingListBodyProps = {
  body: string;
  metaLine?: string;
};

function visibleLineCount(element: HTMLElement) {
  const lineHeight = Number.parseFloat(window.getComputedStyle(element).lineHeight);
  if (!Number.isFinite(lineHeight) || lineHeight <= 0) return 2;
  return Math.max(1, Math.round(element.getBoundingClientRect().height / lineHeight));
}

export function HousingListBody({ body, metaLine }: HousingListBodyProps) {
  const bodyRef = useRef<HTMLParagraphElement | null>(null);
  const [bodyLines, setBodyLines] = useState(2);
  const showHint = Boolean(metaLine && bodyLines <= 1);

  useEffect(() => {
    const element = bodyRef.current;
    if (!element) return;

    const measure = () => {
      setBodyLines(visibleLineCount(element));
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [body]);

  return (
    <div className="mt-2 text-sm leading-6 text-slate-600">
      <p ref={bodyRef} className="line-clamp-2 whitespace-pre-line break-words [overflow-wrap:anywhere]">
        {body}
      </p>
      {metaLine ? <p className="truncate text-zinc-500">{metaLine}</p> : null}
      {showHint ? <p className="truncate text-zinc-500">{CONTACT_SOURCE_HINT_TEXT}</p> : null}
    </div>
  );
}
