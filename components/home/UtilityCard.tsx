"use client";

import Link from "next/link";
import { AlertTriangle, BookOpenCheck, CarFront, ChevronRight, Map } from "lucide-react";
import type { UtilityCardItem } from "./UtilityCards";

const iconMap = {
  dmv: CarFront,
  ticket: AlertTriangle,
  navigation: Map,
  guide: BookOpenCheck,
};

const themeMap = {
  blue: "from-blue-50 to-sky-100 border-blue-100 text-blue-700",
  orange: "from-orange-50 to-rose-100 border-orange-100 text-orange-700",
  cyan: "from-cyan-50 to-blue-100 border-cyan-100 text-cyan-700",
  amber: "from-amber-50 to-yellow-100 border-amber-100 text-amber-700",
};

export function UtilityCard({ item }: { item: UtilityCardItem }) {
  const Icon = iconMap[item.icon];
  const theme = themeMap[item.theme ?? "blue"];

  return (
    <Link
      href={item.href}
      className={`flex min-h-[122px] flex-col justify-between rounded-2xl border bg-gradient-to-br p-3 shadow-[0_1px_10px_rgba(15,23,42,0.06)] transition active:scale-[0.98] ${theme}`}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/75 shadow-sm">
          <Icon size={21} aria-hidden="true" />
        </span>
        <span className="inline-flex items-center gap-0.5 text-[11px] font-black">
          {item.cta ?? "查看"}
          <ChevronRight size={13} aria-hidden="true" />
        </span>
      </span>
      <span>
        <span className="block text-sm font-black leading-tight text-slate-950">{item.title}</span>
        <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-600">{item.description}</span>
      </span>
    </Link>
  );
}
