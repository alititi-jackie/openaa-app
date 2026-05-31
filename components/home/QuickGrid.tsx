import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export type QuickGridItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function QuickGrid({ items }: { items: QuickGridItem[] }) {
  return (
    <section className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg bg-slate-50 p-2 text-center text-xs font-bold text-slate-700"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-blue-600 shadow-sm">
                <Icon size={19} aria-hidden="true" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
