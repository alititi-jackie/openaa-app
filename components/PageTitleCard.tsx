import type { ReactNode } from "react";

type PageTitleCardProps = {
  title: string;
  description?: string;
  secondaryDescription?: string;
  eyebrow?: string;
  actions?: ReactNode;
};

export function PageTitleCard({ title, description, secondaryDescription, eyebrow, actions }: PageTitleCardProps) {
  return (
    <section className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-4 shadow-sm">
      {eyebrow ? <p className="text-xs font-bold uppercase tracking-wide text-blue-600">{eyebrow}</p> : null}
      <div className={`${eyebrow ? "mt-1" : ""} flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between`}>
        <div className="min-w-0">
          <h1 className="text-2xl font-black leading-tight text-slate-950">{title}</h1>
          {description ? <p className="mt-2 text-sm font-bold leading-6 text-blue-700">{description}</p> : null}
          {secondaryDescription ? <p className="mt-2 text-sm leading-6 text-slate-600">{secondaryDescription}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">{actions}</div> : null}
      </div>
    </section>
  );
}
