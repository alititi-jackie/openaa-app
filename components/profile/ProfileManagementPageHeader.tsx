import type { ReactNode } from "react";
import Link from "next/link";

type ProfileManagementPageHeaderProps = {
  title: string;
  description: string;
  actions?: ReactNode;
};

export function ProfileManagementPageHeader({ title, description, actions }: ProfileManagementPageHeaderProps) {
  return (
    <header className="space-y-3">
      <Link
        href="/profile"
        className="inline-flex min-h-10 items-center rounded-xl border border-blue-200 bg-white px-3.5 text-sm font-bold text-blue-700 shadow-[0_2px_8px_rgba(37,99,235,0.12)] transition hover:border-blue-300 hover:bg-blue-50"
      >
        ← 返回
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-black text-slate-950">{title}</h1>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}
