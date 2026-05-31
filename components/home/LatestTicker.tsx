import Link from "next/link";
import { Megaphone } from "lucide-react";

export function LatestTicker({ items }: { items: Array<{ label: string; href: string }> }) {
  return (
    <section className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm shadow-sm">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-blue-700">
        <Megaphone size={18} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-blue-700">最新动态</p>
        <Link href={items[0]?.href ?? "/news"} className="block truncate font-bold text-slate-900">
          {items[0]?.label ?? "欢迎来到 OpenAA"}
        </Link>
      </div>
    </section>
  );
}
