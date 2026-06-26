import type { ReactNode } from "react";

type AdminHighlightCardProps = {
  active?: boolean;
  className?: string;
  children: ReactNode;
};

export function AdminHighlightCard({ active = false, className = "", children }: AdminHighlightCardProps) {
  return (
    <div
      className={[
        "rounded-3xl border bg-slate-50 p-3 transition-colors",
        active ? "border-[#1976d2]" : "border-slate-200",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
