import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type QuickGridItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const quickGridThemes: Record<string, { bg: string; text: string; ring: string; hover: string }> = {
  招聘: { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-100", hover: "hover:border-blue-100 hover:bg-blue-50/60" },
  房屋: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100", hover: "hover:border-emerald-100 hover:bg-emerald-50/60" },
  二手: { bg: "bg-violet-50", text: "text-violet-600", ring: "ring-violet-100", hover: "hover:border-violet-100 hover:bg-violet-50/60" },
  DMV: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-100", hover: "hover:border-amber-100 hover:bg-amber-50/60" },
  新闻: { bg: "bg-rose-50", text: "text-rose-600", ring: "ring-rose-100", hover: "hover:border-rose-100 hover:bg-rose-50/60" },
  导航: { bg: "bg-cyan-50", text: "text-cyan-600", ring: "ring-cyan-100", hover: "hover:border-cyan-100 hover:bg-cyan-50/60" },
  新手指南: { bg: "bg-orange-50", text: "text-orange-600", ring: "ring-orange-100", hover: "hover:border-orange-100 hover:bg-orange-50/60" },
  本地服务: { bg: "bg-teal-50", text: "text-teal-600", ring: "ring-teal-100", hover: "hover:border-teal-100 hover:bg-teal-50/60" },
};

export function QuickGrid({ items }: { items: QuickGridItem[] }) {
  return (
    <section className="w-full rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:p-4">
      <div className="grid w-full grid-cols-4 gap-x-2 gap-y-4 sm:gap-x-3 sm:gap-y-5">
        {items.map((item) => {
          const Icon = item.icon;
          const theme = quickGridThemes[item.label] ?? quickGridThemes["导航"];

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-2xl border border-transparent bg-white p-2 text-center text-[14px] font-semibold leading-tight text-slate-800 shadow-[0_8px_22px_rgba(15,23,42,0.04)] transition active:scale-95 md:min-h-[118px] lg:min-h-[132px]",
                theme.hover,
              )}
            >
              <span className={cn("grid h-[54px] w-[54px] place-items-center rounded-[18px] shadow-sm ring-1 md:h-16 md:w-16 md:rounded-[22px]", theme.bg, theme.text, theme.ring)}>
                <Icon className="h-[26px] w-[26px] md:h-8 md:w-8" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
