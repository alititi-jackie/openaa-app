import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type AdminCollapsibleCardProps = {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  summaryClassName?: string;
  contentClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  toggleClassName?: string;
};

export function AdminCollapsibleCard({
  title,
  description,
  children,
  defaultOpen = false,
  className,
  summaryClassName,
  contentClassName,
  titleClassName,
  descriptionClassName,
  toggleClassName,
}: AdminCollapsibleCardProps) {
  return (
    <details open={defaultOpen} className={cn("group rounded-2xl border border-slate-100 bg-white p-3 shadow-sm", className)}>
      <summary className={cn("flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden", summaryClassName)}>
        <div className="min-w-0">
          <p className={cn("text-sm font-black text-slate-950", titleClassName)}>{title}</p>
          {description ? <p className={cn("mt-1 text-xs font-semibold text-slate-500", descriptionClassName)}>{description}</p> : null}
        </div>
        <span className={cn("inline-flex min-h-9 shrink-0 items-center rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-black text-white", toggleClassName)}>
          <span className="group-open:hidden">展开</span>
          <span className="hidden group-open:inline">收起</span>
        </span>
      </summary>
      <div className={cn("mt-3 border-t border-slate-100 pt-3", contentClassName)}>{children}</div>
    </details>
  );
}
