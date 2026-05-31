"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { bottomNavItems } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[560px] -translate-x-1/2 border-t border-slate-100 bg-white/95 px-2 pb-[max(0.55rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-6px_24px_rgba(15,23,42,0.08)] backdrop-blur md:max-w-[760px] lg:max-w-[960px] xl:max-w-[1040px]">
      <div className="grid h-16 grid-cols-5 items-end gap-1">
        {bottomNavItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 py-1 text-[12.5px] font-medium leading-none transition-colors",
                active ? "text-blue-600" : "text-slate-600 hover:text-slate-900",
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.1 : 1.8} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
