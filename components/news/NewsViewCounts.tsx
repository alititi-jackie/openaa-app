"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
type Counts = Record<string, number | null>;
const ViewCounts = createContext<Counts>({});
export function NewsViewCounts({
  ids,
  scope,
  children,
}: {
  ids: string[];
  scope: "detail" | "list";
  children: ReactNode;
}) {
  const idsKey = ids.join(",");
  const [result, setResult] = useState<{ key: string; counts: Counts }>({
    key: "",
    counts: {},
  });
  const key = `${scope}:${idsKey}`;
  useEffect(() => {
    let active = true;
    let sequence = 0;
    async function refresh() {
      const current = ++sequence;
      try {
        const response = await fetch(
          `/api/news/views?scope=${scope}&ids=${encodeURIComponent(idsKey)}`,
          { cache: "no-store" },
        );
        const data = await response.json();
        if (active && current === sequence)
          setResult({
            key,
            counts: response.ok && data.enabled ? (data.counts ?? {}) : {},
          });
      } catch {
        if (active && current === sequence) setResult({ key, counts: {} });
      }
    }
    if (idsKey) void refresh();
    window.addEventListener("openaa:page-view-recorded", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.removeEventListener("openaa:page-view-recorded", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [idsKey, key, scope]);
  return (
    <ViewCounts.Provider value={result.key === key ? result.counts : {}}>
      {children}
    </ViewCounts.Provider>
  );
}
export function NewsViewCount({ id }: { id: string }) {
  const count = useContext(ViewCounts)[id];
  if (typeof count !== "number" || !Number.isFinite(count)) return null;
  return (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-slate-400">
      <span aria-hidden="true">👁</span> 浏览：{count.toLocaleString("en-US")}
    </span>
  );
}
