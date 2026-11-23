import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function ProfileSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <details className="group border-b border-zinc-100 open:m-2 open:overflow-hidden open:rounded-2xl open:border open:border-[#1976d2] open:bg-white">
      <summary className="m-2 flex cursor-pointer list-none items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/70 p-4 transition hover:bg-blue-50 group-open:m-0 group-open:rounded-none group-open:border-0 group-open:bg-white group-open:hover:bg-zinc-50">
        <span className="flex items-center gap-2">
          <span className="font-medium text-zinc-900">{title}</span>
          <span className="text-[11px] text-zinc-400">{description}</span>
        </span>
        <ChevronDown size={18} className="text-zinc-400" aria-hidden="true" />
      </summary>
      {children}
    </details>
  );
}
