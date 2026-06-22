"use client";

import { useState, type ReactNode } from "react";

export function AdminDeletionSettingsCard({ title = "删除设置", children }: { title?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
        <button type="button" onClick={() => setOpen((current) => !current)} className="text-sm font-black text-blue-700 hover:text-blue-800">
          {open ? "收起" : "展开"}
        </button>
      </div>
      {open ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
