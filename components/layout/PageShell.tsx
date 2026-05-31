import type { ReactNode } from "react";

type PageShellProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  children?: ReactNode;
};

export function PageShell({ title, description, eyebrow, children }: PageShellProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-wide text-blue-600">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-black leading-tight text-slate-950">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
      </section>
      {children}
    </div>
  );
}
