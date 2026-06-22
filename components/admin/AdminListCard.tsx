import type { ReactNode } from "react";
import { AdminCard } from "./AdminCard";

export function AdminListCard({
  title,
  description,
  meta,
  children,
}: {
  title: string;
  description?: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <AdminCard title={title} description={description}>
      {meta ? <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">{meta}</div> : null}
      {children}
    </AdminCard>
  );
}
