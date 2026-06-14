"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { deleteTopQuickLink, setTopQuickLinkVisibility, upsertTopQuickLink } from "@/features/admin-home/actions";
import type { AdminHomeActionState, AdminTopQuickLinkRow } from "@/features/admin-home/types";

type TopLinkFormValues = {
  title: string;
  url: string;
  openMode: "same" | "new";
  sortOrder: number;
};

const initialState: AdminHomeActionState = { ok: true, message: "" };

const buttonBase = "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50";
const neutralButtonClass = `${buttonBase} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`;
const primaryButtonClass = `${buttonBase} border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100`;
const dangerButtonClass = `${buttonBase} border-red-100 bg-red-50 text-red-600 hover:bg-red-100`;

const inputClass = "min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500";

export function TopQuickLinksManagement({ topLinks }: { topLinks: AdminTopQuickLinkRow[] }) {
  const [creating, setCreating] = useState(false);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">顶部快捷导航</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">管理 Header 城市入口里的快捷网站，只保留名称、网址、打开方式和排序。</p>
        </div>
        <button type="button" onClick={() => setCreating((value) => !value)} className={primaryButtonClass}>
          <Plus size={14} aria-hidden="true" />
          新增网站
        </button>
      </div>

      {creating ? (
        <div className="mt-4 rounded-2xl border border-blue-200 bg-white p-3">
          <TopQuickLinkEditor
            mode="create"
            onCancel={() => setCreating(false)}
            onSaved={() => {
              setCreating(false);
            }}
          />
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        {topLinks.length > 0 ? (
          topLinks.map((link) => <TopQuickLinkCard key={link.id} link={link} />)
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">暂无顶部快捷导航。</p>
        )}
      </div>
    </section>
  );
}

function TopQuickLinkCard({ link }: { link: AdminTopQuickLinkRow }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [message, setMessage] = useState<AdminHomeActionState | null>(null);
  const [pendingVisibility, startVisibilityTransition] = useTransition();
  const [pendingDelete, startDeleteTransition] = useTransition();

  function toggleVisible() {
    startVisibilityTransition(async () => {
      const formData = new FormData();
      formData.set("id", link.id);
      formData.set("is_active", link.is_active ? "false" : "true");
      const result = await setTopQuickLinkVisibility(initialState, formData);
      if (!result.ok) {
        setMessage(result);
        return;
      }

      setMessage(result);
      router.refresh();
    });
  }

  function deleteLink() {
    startDeleteTransition(async () => {
      const formData = new FormData();
      formData.set("id", link.id);
      const result = await deleteTopQuickLink(initialState, formData);
      if (!result.ok) {
        setMessage(result);
        setDeleteOpen(false);
        return;
      }

      setDeleteOpen(false);
      router.refresh();
    });
  }

  return (
    <article className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
      <div className="min-w-0">
        <h3 className="truncate text-sm font-black text-slate-950">{link.title}</h3>
        <p className="mt-1 break-all text-xs font-semibold text-slate-500">{link.href}</p>
        <p className="mt-1 text-xs font-semibold text-slate-400">
          {link.is_active ? "显示" : "隐藏"} · {openModeLabel(link.open_mode)} · 排序 {link.sort_order}
        </p>
      </div>

      {message?.message ? <p className={message.ok ? "mt-3 text-sm font-semibold leading-6 text-emerald-700" : "mt-3 text-sm font-semibold leading-6 text-red-600"}>{message.message}</p> : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setEditing((value) => !value)} className={neutralButtonClass}>
          <Pencil size={14} aria-hidden="true" />
          修改
        </button>
        <button type="button" onClick={toggleVisible} disabled={pendingVisibility} className={neutralButtonClass}>
          {link.is_active ? "隐藏" : "显示"}
        </button>
        <button type="button" onClick={() => setDeleteOpen(true)} disabled={pendingDelete} className={dangerButtonClass}>
          <Trash2 size={14} aria-hidden="true" />
          删除
        </button>
      </div>

      {editing ? (
        <div className="mt-3 rounded-2xl border border-blue-200 bg-white p-3">
          <TopQuickLinkEditor
            mode="edit"
            link={link}
            onCancel={() => setEditing(false)}
            onSaved={(message) => {
              setEditing(false);
              setMessage({ ok: true, message });
            }}
          />
        </div>
      ) : null}

      <AdminConfirmDialog
        open={deleteOpen}
        title="确认删除快捷导航？"
        description="删除后将从顶部快捷导航配置中移除。"
        confirmLabel="确认删除"
        cancelLabel="取消"
        tone="danger"
        pending={pendingDelete}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={deleteLink}
      />
    </article>
  );
}

function TopQuickLinkEditor({
  mode,
  link,
  onCancel,
  onSaved,
}: {
  mode: "create" | "edit";
  link?: AdminTopQuickLinkRow;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<AdminHomeActionState | null>(null);
  const [values, setValues] = useState<TopLinkFormValues>({
    title: link?.title ?? "",
    url: link?.href ?? "",
    openMode: link?.open_mode ?? "same",
    sortOrder: link?.sort_order ?? 0,
  });

  function updateValue<Key extends keyof TopLinkFormValues>(key: Key, value: TopLinkFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function save() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", link?.id ?? "");
      formData.set("title", values.title);
      formData.set("url", values.url);
      formData.set("open_mode", values.openMode);
      formData.set("sort_order", String(values.sortOrder));
      if (link?.is_active ?? true) formData.set("is_active", "on");

      const result = await upsertTopQuickLink(initialState, formData);
      setMessage(result);
      if (!result.ok) return;

      router.refresh();
      onSaved(result.message);
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-bold text-slate-700">
          <span>网站名称</span>
          <input value={values.title} onChange={(event) => updateValue("title", event.target.value)} className={inputClass} required />
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-700">
          <span>网址</span>
          <input value={values.url} onChange={(event) => updateValue("url", event.target.value)} placeholder="/jobs" className={inputClass} required />
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-700">
          <span>打开方式</span>
          <select value={values.openMode} onChange={(event) => updateValue("openMode", event.target.value === "new" ? "new" : "same")} className={inputClass}>
            <option value="same">当前窗口</option>
            <option value="new">新窗口</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-700">
          <span>排序</span>
          <input value={values.sortOrder} onChange={(event) => updateValue("sortOrder", Number(event.target.value))} type="number" className={inputClass} />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={save} disabled={pending} className={primaryButtonClass}>
          {pending ? "保存中..." : mode === "create" ? "保存网站" : "保存修改"}
        </button>
        <button type="button" onClick={onCancel} disabled={pending} className={neutralButtonClass}>
          取消
        </button>
        {message?.message ? <p className={message.ok ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-red-600"}>{message.message}</p> : null}
      </div>
    </div>
  );
}

function openModeLabel(value: AdminTopQuickLinkRow["open_mode"]) {
  return value === "new" ? "新窗口" : "当前窗口";
}
