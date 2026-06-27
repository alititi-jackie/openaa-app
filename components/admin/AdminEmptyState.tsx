import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type AdminEmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
  align?: "left" | "center";
  compact?: boolean;
};

export function AdminEmptyState({ title, description, icon, className, align = "center", compact = false }: AdminEmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500",
        compact ? "px-3 py-3" : "p-4",
        align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      {icon ? <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-white text-slate-600">{icon}</div> : null}
      <p className="font-bold text-slate-500">{title}</p>
      {description ? <p className="mt-2 leading-6 text-slate-600">{description}</p> : null}
    </div>
  );
}
