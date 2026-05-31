import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function HomeSectionShell({
  title,
  actionHref,
  actionLabel = "更多",
  children,
}: {
  title: string;
  actionHref?: string;
  actionLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-5 w-1 rounded-full bg-blue-600" aria-hidden="true" />
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
        </div>
        {actionHref ? (
          <Link href={actionHref} className="inline-flex items-center gap-0.5 text-sm font-bold text-blue-600">
            {actionLabel}
            <ChevronRight size={15} aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
