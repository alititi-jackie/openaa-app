"use client";

import { useState } from "react";
import { AdminActionForm, AdminCheckbox, AdminTextInput } from "@/components/admin/AdminActionForm";
import type { AdminHomeActionState } from "@/features/admin-home/types";

type ManualTickerCreateFormProps = {
  action: (state: AdminHomeActionState, formData: FormData) => Promise<AdminHomeActionState>;
};

export function ManualTickerCreateForm({ action }: ManualTickerCreateFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-10 w-fit items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white"
      >
        新增动态
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
      <div className="mb-3">
        <p className="text-sm font-black text-slate-900">新增手动动态</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">只填写标题、链接和时间；新增后会排在现有动态前面。</p>
      </div>
      <AdminActionForm
        action={action}
        submitLabel="保存动态"
        onSuccess={() => setIsOpen(false)}
        footerStart={
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700"
          >
            取消
          </button>
        }
      >
        <input type="hidden" name="id" value="" />
        <input type="hidden" name="sort_order" value="" />
        <div className="grid gap-3 md:grid-cols-2">
          <AdminTextInput label="标题" name="title" required />
          <AdminTextInput label="链接" name="href" placeholder="/news 或 https://openaa.com/news" required />
          <AdminTextInput label="开始时间" name="starts_at" type="datetime-local" />
          <AdminTextInput label="结束时间" name="ends_at" type="datetime-local" />
        </div>
        <AdminCheckbox label="启用" name="is_enabled" defaultChecked />
      </AdminActionForm>
    </div>
  );
}
