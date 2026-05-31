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
      <div className="mx-auto grid max-w-[430px] grid-cols-4 gap-2 md:max-w-[520px]">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex aspect-square min-h-0 flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 p-2 text-center text-xs font-bold text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-blue-600 shadow-sm md:h-10 md:w-10">
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
