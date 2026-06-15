import type { ReactNode } from "react";

export function SeoInfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      <div className="mt-2 text-sm leading-6 text-slate-600">{children}</div>
    </section>
  );
}
