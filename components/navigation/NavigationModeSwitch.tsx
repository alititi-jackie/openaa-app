import Link from "next/link";
import { Map } from "lucide-react";
import { NavigationDefaultToggle } from "./NavigationDefaultToggle";

export function NavigationModeSwitch() {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-2 shadow-sm">
      <div className="grid grid-cols-[minmax(0,7fr)_minmax(118px,3fr)] gap-2">
        <Link
          href="/navigation"
          className="flex min-h-[82px] items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-slate-700 transition hover:bg-slate-50 active:scale-[0.99]"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-blue-700 shadow-sm">
            <Map size={20} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-black text-slate-950 sm:text-base">OpenAA 导航</span>
            <span className="mt-1 block truncate text-xs font-semibold text-slate-400">平台常用网站</span>
          </span>
        </Link>
        <NavigationDefaultToggle />
      </div>
    </section>
  );
}
