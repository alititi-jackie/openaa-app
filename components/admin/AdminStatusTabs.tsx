import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type AdminStatusTab<T extends string> = {
  value: T;
  label: ReactNode;
  href: string;
  count?: number;
  active?: boolean;
};

type AdminStatusTabsVariant = "dark" | "blue" | "solidBlue";
type AdminStatusTabsSize = "sm" | "md";

type AdminStatusTabsProps<T extends string> = {
  tabs: Array<AdminStatusTab<T>>;
  activeValue?: T;
  ariaLabel: string;
  variant?: AdminStatusTabsVariant;
  size?: AdminStatusTabsSize;
  className?: string;
  listClassName?: string;
  linkClassName?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  renderCount?: (count: number, active: boolean) => ReactNode;
  renderStart?: ReactNode;
};

const sizeClasses: Record<AdminStatusTabsSize, string> = {
  sm: "min-h-9 px-3 py-2 text-xs",
  md: "min-h-10 px-4 py-2 text-sm",
};

const activeVariantClasses: Record<AdminStatusTabsVariant, string> = {
  dark: "bg-slate-950 text-white ring-slate-950",
  blue: "bg-blue-50 text-blue-800 ring-blue-200",
  solidBlue: "bg-blue-600 text-white ring-blue-600",
};

const inactiveVariantClasses: Record<AdminStatusTabsVariant, string> = {
  dark: "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
  blue: "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
  solidBlue: "bg-white text-slate-700 ring-slate-200 hover:bg-blue-50 hover:ring-blue-200",
};

export function AdminStatusTabs<T extends string>({
  tabs,
  activeValue,
  ariaLabel,
  variant = "blue",
  size = "md",
  className,
  listClassName,
  linkClassName,
  activeClassName,
  inactiveClassName,
  renderCount,
  renderStart,
}: AdminStatusTabsProps<T>) {
  return (
    <nav aria-label={ariaLabel} className={cn("max-w-full overflow-x-auto overflow-y-hidden whitespace-nowrap py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}>
      <div className={cn("inline-flex gap-2", listClassName)}>
        {renderStart}
        {tabs.map((tab) => {
          const active = tab.active ?? tab.value === activeValue;

          return (
            <Link
              key={tab.value}
              href={tab.href}
              className={cn(
                "inline-flex shrink-0 items-center justify-center rounded-xl font-black ring-1 transition",
                sizeClasses[size],
                active ? activeClassName ?? activeVariantClasses[variant] : inactiveClassName ?? inactiveVariantClasses[variant],
                linkClassName,
              )}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" ? renderCount ? renderCount(tab.count, active) : <span className="ml-1 text-xs opacity-70">{tab.count}</span> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
