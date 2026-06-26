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
        "rounded-2xl border bg-white p-3 shadow-sm transition-colors",
        active ? "border-[#1976d2]" : "border-slate-100",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
