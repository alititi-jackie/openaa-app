import Link from "next/link";
import type { ReactNode } from "react";
import { BookmarkPlus, Map } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { NavigationDefaultToggle } from "./NavigationDefaultToggle";

export function NavigationModeSwitch({ active }: { active: "public" | "my" }) {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-2 shadow-sm">
      <div className="grid grid-cols-[minmax(0,7fr)_minmax(118px,3fr)] gap-2">
        <NavigationModeCard
          href="/navigation"
          active={active === "public"}
          icon={<Map size={20} aria-hidden="true" />}
          title="OpenAA 导航"
          description="平台常用网站"
        />
        <NavigationModeCard
          href="/navigation/my"
          active={active === "my"}
          icon={<BookmarkPlus size={20} aria-hidden="true" />}
          title="我的导航"
          description="我的常用网站"
          action={<NavigationDefaultToggle />}
        />
      </div>
    </section>
  );
}

function NavigationModeCard({
  href,
  active,
  icon,
  title,
  description,
  action,
}: {
  href: string;
  active: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const className = cn(
    "flex min-h-[86px] gap-2 rounded-2xl border p-3 transition active:scale-[0.99]",
    action ? "flex-col items-stretch justify-between" : "items-center justify-between",
    active ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm" : "border-slate-100 bg-slate-50/70 text-slate-700 hover:bg-slate-50",
  );
  const content = (
    <span className="flex min-w-0 items-center gap-2 sm:gap-3">
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white shadow-sm", active ? "text-blue-700" : "text-slate-500")}>{icon}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-black text-slate-950 sm:text-base">{title}</span>
        <span className="mt-1 block truncate text-xs font-semibold text-slate-500">{description}</span>
      </span>
    </span>
  );

  if (!action) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <div className={className}>
      <Link href={href} className="min-w-0 flex-1">
        {content}
      </Link>
      {action}
    </div>
  );
}
