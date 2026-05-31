import Link from "next/link";
import { Megaphone } from "lucide-react";

export function LatestTicker({ items }: { items: Array<{ label: string; href: string }> }) {
  return (
    <section className="flex min-h-11 items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm shadow-sm">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-blue-700">
        <Megaphone size={17} aria-hidden="true" />
      </span>
      <Link
        href={items[0]?.href ?? "/news"}
        className="min-w-0 flex-1 truncate whitespace-nowrap font-bold text-slate-900"
      >
        <span className="mr-2 font-black text-blue-700">最新动态</span>
        {items[0]?.label ?? "欢迎来到 OpenAA"}
      </Link>
    </section>
  );
}
