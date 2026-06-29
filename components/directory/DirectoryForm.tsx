"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { upsertDirectoryItem, type DirectoryActionState } from "@/features/directory/actions";
import type { DirectoryItem, DirectoryItemType } from "@/features/directory/types";

const initialState: DirectoryActionState = { ok: true, message: "" };

export function DirectoryForm({
  item,
  itemType,
  onSaved,
  onCancel,
}: {
  item?: DirectoryItem;
  itemType: DirectoryItemType;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [value, setValue] = useState(item?.value ?? "");
  const formRef = useRef<HTMLFormElement | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isEdit = Boolean(item);
  const labels = itemType === "phone"
    ? { name: "姓名", value: "电话号码", namePlaceholder: "例如：张三", valuePlaceholder: "例如：212-555-1234", save: "保存电话" }
    : { name: "名称", value: "地址", namePlaceholder: "例如：家", valuePlaceholder: "例如：123 Main St, New York, NY", save: "保存地址" };

  async function saveDirectoryItem(state: DirectoryActionState, formData: FormData) {
    const result = await upsertDirectoryItem(state, formData);
    if (result.ok && result.message) {
      if (!isEdit) {
        formRef.current?.reset();
        setName("");
        setValue("");
      }
      closeTimeoutRef.current = setTimeout(() => onSaved?.(), 700);
    }
    return result;
  }

  const [state, formAction, pending] = useActionState(saveDirectoryItem, initialState);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  return (
    <form ref={formRef} action={formAction} className="rounded-2xl border border-blue-100 bg-blue-50/40 p-3 shadow-sm sm:p-4">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <input type="hidden" name="item_type" value={itemType} />
      <input type="hidden" name="sort_order" value={item?.sortOrder ?? 0} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-bold text-slate-600">
          <span>{labels.name}</span>
          <input
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={labels.namePlaceholder}
            required
            className="min-h-12 rounded-xl border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-600">
          <span>{labels.value}</span>
          <input
            name="value"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={labels.valuePlaceholder}
            required
            className="min-h-12 rounded-xl border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      {state.message ? (
        <p className={`mt-3 rounded-xl px-3 py-2 text-sm font-bold ${state.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
          {state.message}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        {onCancel ? (
          <button type="button" onClick={onCancel} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700">
            取消
          </button>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "保存中..." : isEdit ? "保存修改" : labels.save}
        </button>
      </div>
    </form>
  );
}
