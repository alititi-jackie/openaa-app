import type { ReactNode } from "react";

export function AdminActionGroup({ children, align = "start" }: { children: ReactNode; align?: "start" | "end" }) {
  return <div className={`flex flex-wrap items-center gap-2 ${align === "end" ? "justify-end" : ""}`}>{children}</div>;
}
