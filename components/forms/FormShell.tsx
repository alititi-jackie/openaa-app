import type { ReactNode } from "react";

type FormShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function FormShell({ title, description, children }: FormShellProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Publish</p>
        <h1 className="mt-1 text-2xl font-black leading-tight text-slate-950">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </section>
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">{children}</section>
    </div>
  );
}
