import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export type UtilityCardItem = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export function UtilityCards({ items }: { items: UtilityCardItem[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-black text-slate-950">实用工具</h2>
      <div className="grid gap-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
                <Icon size={21} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block font-black text-slate-950">{item.title}</span>
                <span className="mt-1 block text-sm leading-6 text-slate-600">{item.description}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
