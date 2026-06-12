import type { ReactNode } from "react";
import { AdminBackNavigation } from "./AdminBackNavigation";

type AdminPageHeaderProps = {
  title: string;
  description: string;
  children?: ReactNode;
  backHref?: string;
  backLabel?: string;
  showBackLink?: boolean;
};

export function AdminPageHeader({
  title,
  description,
  children,
  backHref,
  backLabel,
  showBackLink = true,
}: AdminPageHeaderProps) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      {showBackLink ? (
        <div className="mb-4 flex justify-start">
          <AdminBackNavigation href={backHref} label={backLabel} />
        </div>
      ) : null}
      <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Admin</p>
      <h1 className="mt-1 text-2xl font-black leading-tight text-slate-950">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      {children ? <div className="mt-4 flex flex-wrap gap-2">{children}</div> : null}
    </section>
  );
}
