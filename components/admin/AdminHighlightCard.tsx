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
        "rounded-3xl border p-3 transition-colors",
        active ? "border-[#1976d2] bg-blue-50/30 ring-2 ring-blue-100" : "border-slate-200 bg-slate-50",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
