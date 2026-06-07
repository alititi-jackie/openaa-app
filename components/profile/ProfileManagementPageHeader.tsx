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
        className="sticky top-14 z-30 mb-4 inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 text-sm font-medium text-blue-600 shadow-sm transition active:scale-[0.97]"
      >
        ← 返回
      </Link>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}

export function ProfilePublishLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex h-10 items-center rounded-xl border border-blue-100 bg-blue-50 px-4 text-sm text-blue-600 transition hover:bg-blue-100">
      {label}
    </Link>
  );
}
