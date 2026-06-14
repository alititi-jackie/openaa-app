import type { ReactNode } from "react";

export type AdminDetailMetaItem = {
  label: string;
  value: ReactNode;
};

export function AdminDetailLayout({
  back,
  title,
  description,
  badges,
  meta,
  children,
  footer,
}: {
  back?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  badges?: ReactNode;
  meta?: AdminDetailMetaItem[];
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      {back ? <div className="flex flex-wrap items-center gap-2">{back}</div> : null}

      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-black text-slate-950">{title}</h1>
            {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
          </div>
          {badges ? <div className="flex shrink-0 flex-wrap gap-2">{badges}</div> : null}
        </div>

        {meta && meta.length > 0 ? (
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
            {meta.map((item) => (
              <div key={item.label} className="rounded-xl bg-slate-50 p-3">
                <span className="block text-xs font-bold text-slate-500">{item.label}</span>
                <span className="mt-1 block break-words font-semibold text-slate-950">{item.value}</span>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {children}

      {footer ? <div className="flex flex-wrap items-center gap-2">{footer}</div> : null}
    </div>
  );
}

export function AdminDetailSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
