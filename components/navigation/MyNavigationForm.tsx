"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { upsertUserNavigationLink, type NavigationActionState } from "@/features/navigation/actions";
import type { UserNavigationLink } from "@/features/navigation/types";

const initialState: NavigationActionState = { ok: true, message: "" };

export function MyNavigationForm({
  link,
  onSaved,
  onCancel,
}: {
  link?: UserNavigationLink;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const [state, formAction, pending] = useActionState(upsertUserNavigationLink, initialState);
  const [url, setUrl] = useState(link?.url ?? "");
  const [title, setTitle] = useState(link?.title ?? "");
  const formRef = useRef<HTMLFormElement | null>(null);
  const handledMessageRef = useRef("");
  const isEdit = Boolean(link);

  useEffect(() => {
    if (!state.ok || !state.message) return;
    if (handledMessageRef.current === state.message) return;
    handledMessageRef.current = state.message;
    if (!isEdit) {
      formRef.current?.reset();
      setUrl("");
      setTitle("");
    }
    onSaved?.();
  }, [isEdit, onSaved, state.message, state.ok]);

  function fillTitleFromUrl() {
    if (title.trim()) return;
    const generated = titleFromUrl(url);
    if (generated) setTitle(generated);
  }

  return (
    <form ref={formRef} action={formAction} className="rounded-2xl border border-blue-100 bg-blue-50/40 p-3 shadow-sm sm:p-4">
      <input type="hidden" name="id" value={link?.id ?? ""} />
      <input type="hidden" name="sort_order" value={link?.sortOrder ?? 0} />
      <input type="hidden" name="open_mode" value="new" />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-bold text-slate-700">
          <span>网址</span>
          <input
            name="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onBlur={fillTitleFromUrl}
            placeholder="google.com"
            required
            className="min-h-12 rounded-xl border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-700">
          <span>网站名称</span>
          <input
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例如：华人OpenAA"
            className="min-h-12 rounded-xl border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
          {pending ? "保存中..." : isEdit ? "保存修改" : "保存网址"}
        </button>
      </div>
    </form>
  );
}

function titleFromUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    const hostname = url.hostname.replace(/^www\./, "");
    const parts = hostname.split(".").filter(Boolean);
    const nameParts = parts.length > 2 ? parts.slice(0, -1) : parts.slice(0, 1);
    return nameParts.map(capitalize).join(" ");
  } catch {
    return "";
  }
}

function capitalize(value: string) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
