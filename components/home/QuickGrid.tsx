import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type QuickGridItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const quickGridThemes: Record<string, { bg: string; text: string; ring: string; hover: string }> = {
  招聘: { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-100", hover: "hover:text-blue-700" },
  房屋: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100", hover: "hover:text-emerald-700" },
  二手: { bg: "bg-violet-50", text: "text-violet-600", ring: "ring-violet-100", hover: "hover:text-violet-700" },
  DMV: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-100", hover: "hover:text-amber-700" },
  新闻: { bg: "bg-rose-50", text: "text-rose-600", ring: "ring-rose-100", hover: "hover:text-rose-700" },
  导航: { bg: "bg-cyan-50", text: "text-cyan-600", ring: "ring-cyan-100", hover: "hover:text-cyan-700" },
  新手指南: { bg: "bg-orange-50", text: "text-orange-600", ring: "ring-orange-100", hover: "hover:text-orange-700" },
  本地服务: { bg: "bg-teal-50", text: "text-teal-600", ring: "ring-teal-100", hover: "hover:text-teal-700" },
};

export function QuickGrid({ items }: { items: QuickGridItem[] }) {
  return (
    <section className="w-full rounded-2xl border border-slate-100 bg-white px-3 py-5 shadow-sm sm:px-4">
      <div className="grid w-full grid-cols-4 gap-x-2 gap-y-4 sm:gap-x-3 sm:gap-y-5">
        {items.map((item) => {
          const Icon = item.icon;
          const theme = quickGridThemes[item.label] ?? quickGridThemes["导航"];

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-2xl px-1 text-center text-[14px] font-medium leading-tight text-slate-800 transition active:scale-95 md:min-h-[106px] lg:min-h-[116px]",
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
