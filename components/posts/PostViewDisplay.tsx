"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Eye } from "lucide-react";
import { normalizePostViewSettings, type PostViewSettings } from "@/features/posts/viewSettings";
import { formatViewCount } from "@/features/posts/display";

const ViewDisplay = createContext<PostViewSettings | null>(null);

// One settings request for all public cards; collection is independent of this provider.
export function PostViewDisplayProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PostViewSettings | null>(null);
  const pathname = usePathname();
  useEffect(() => {
    let active = true;
    let sequence = 0;
    async function refresh() {
      const current = ++sequence;
      try {
        const response = await fetch("/api/posts/view-display", { cache: "no-store" });
        const data = await response.json();
        if (active && current === sequence) setSettings(response.ok && data.settings ? normalizePostViewSettings(data.settings) : null);
      } catch {
        if (active && current === sequence) setSettings(null);
      }
    }
    void refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, [pathname]);
  return <ViewDisplay.Provider value={settings}>{children}</ViewDisplay.Provider>;
}

export function usePostViewDisplay(scope: keyof PostViewSettings) {
  return useContext(ViewDisplay)?.[scope] === true;
}

export function PostListViewCount({ count }: { count?: number }) {
  const enabled = usePostViewDisplay("list");
  if (!enabled) return null;
  return <span className="inline-flex items-center gap-1"><Eye size={13} aria-hidden="true" />{formatViewCount(count)}</span>;
}
