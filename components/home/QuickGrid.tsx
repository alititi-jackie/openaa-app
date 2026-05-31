import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export type QuickGridItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function QuickGrid({ items }: { items: QuickGridItem[] }) {
  return (
    <section className="w-full rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
      <div className="grid w-full grid-cols-4 gap-2 sm:gap-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 p-2 text-center text-xs font-bold text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 md:min-h-[118px] md:text-sm lg:min-h-[136px] xl:min-h-[148px]"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm md:h-14 md:w-14">
                <Icon className="h-6 w-6 md:h-7 md:w-7" aria-hidden="true" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
