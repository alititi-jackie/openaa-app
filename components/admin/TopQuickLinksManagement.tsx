"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { deleteTopQuickLink, moveTopQuickLink, setTopQuickLinkVisibility, upsertTopQuickLink } from "@/features/admin-home/actions";
import type { AdminHomeActionState, AdminTopQuickLinkRow } from "@/features/admin-home/types";

type TopLinkFormValues = {
  title: string;
  url: string;
  openMode: "same" | "new";
};

const initialState: AdminHomeActionState = { ok: true, message: "" };

const buttonBase = "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50";
const neutralButtonClass = `${buttonBase} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`;
const primaryButtonClass = `${buttonBase} border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100`;
const dangerButtonClass = `${buttonBase} border-red-100 bg-red-50 text-red-600 hover:bg-red-100`;

const inputClass = "min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500";

export function TopQuickLinksManagement({ topLinks }: { topLinks: AdminTopQuickLinkRow[] }) {
  const [creating, setCreating] = useState(false);
  const [optimisticLinks, setOptimisticLinks] = useState<AdminTopQuickLinkRow[]>([]);
  const optimisticById = new Map(optimisticLinks.map((link) => [link.id, link]));
  const renderedLinks = [
    ...optimisticLinks.filter((link) => !topLinks.some((item) => item.id === link.id)),
    ...topLinks.map((link) => optimisticById.get(link.id) ?? link),
  ];

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-lg font-black text-slate-950">顶部快捷导航</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">管理 Header 城市入口里的快捷网站，只保留网址、网站名称和打开方式，排序在卡片里调整。</p>
      </div>

      <div className="mt-4">
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
            onSaved={(link) => {
              setOptimisticLinks((current) => [link, ...current.filter((item) => item.id !== link.id)]);
              setCreating(false);
            }}
          />
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        {renderedLinks.length > 0 ? (
          renderedLinks.map((link, index) => (
            <TopQuickLinkCard
              key={link.id}
              link={link}
              index={index}
              total={renderedLinks.length}
              onLinkChange={(updatedLink) => setOptimisticLinks((current) => [updatedLink, ...current.filter((item) => item.id !== updatedLink.id)])}
            />
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">暂无顶部快捷导航。</p>
        )}
      </div>
    </section>
  );
}

function TopQuickLinkCard({ link, index, total, onLinkChange }: { link: AdminTopQuickLinkRow; index: number; total: number; onLinkChange: (link: AdminTopQuickLinkRow) => void }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [message, setMessage] = useState<AdminHomeActionState | null>(null);
  const [pendingMove, startMoveTransition] = useTransition();
  const [pendingVisibility, startVisibilityTransition] = useTransition();
  const [pendingDelete, startDeleteTransition] = useTransition();

  function move(direction: "up" | "down") {
    startMoveTransition(async () => {
      const formData = new FormData();
      formData.set("id", link.id);
      formData.set("direction", direction);
      const result = await moveTopQuickLink(initialState, formData);
      setMessage(result);
      if (result.ok) router.refresh();
    });
  }

  function toggleVisible() {
    startVisibilityTransition(async () => {
      const formData = new FormData();
      formData.set("id", link.id);
      formData.set("is_active", link.is_active ? "false" : "true");
      const result = await setTopQuickLinkVisibility(initialState, formData);
      setMessage(result);
      if (result.ok) router.refresh();
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
          {link.is_active ? "显示" : "隐藏"} · {openModeLabel(link.open_mode)}
        </p>
      </div>

      {message?.message ? <p className={message.ok ? "mt-3 text-sm font-semibold leading-6 text-emerald-700" : "mt-3 text-sm font-semibold leading-6 text-red-600"}>{message.message}</p> : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => move("up")} disabled={pendingMove || index === 0} className={neutralButtonClass} aria-label="上移">
          <ArrowUp size={14} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => move("down")} disabled={pendingMove || index === total - 1} className={neutralButtonClass} aria-label="下移">
          <ArrowDown size={14} aria-hidden="true" />
        </button>
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
            onSaved={(updatedLink, message) => {
              setEditing(false);
              onLinkChange(updatedLink);
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
  onSaved: (link: AdminTopQuickLinkRow, message: string) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<AdminHomeActionState | null>(null);
  const [values, setValues] = useState<TopLinkFormValues>({
    title: link?.title ?? "",
    url: link?.href ?? "",
    openMode: link?.open_mode ?? "new",
  });
  const [titleTouched, setTitleTouched] = useState(Boolean(link?.title));

  function updateValue<Key extends keyof TopLinkFormValues>(key: Key, value: TopLinkFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateUrl(nextUrl: string) {
    setValues((current) => ({
      ...current,
      url: nextUrl,
      title: !titleTouched ? titleFromUrl(nextUrl) : current.title,
    }));
  }

  function save() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", link?.id ?? "");
      formData.set("title", values.title);
      formData.set("url", values.url);
      formData.set("open_mode", values.openMode);

      const result = await upsertTopQuickLink(initialState, formData);
      setMessage(result);
      if (!result.ok) return;

      const normalizedUrl = result.normalizedUrl ?? values.url;
      const savedLink: AdminTopQuickLinkRow = {
        id: result.id ?? link?.id ?? `temp-${Date.now()}`,
        key: link?.key ?? `temp-${Date.now()}`,
        title: values.title || titleFromUrl(normalizedUrl),
        href: normalizedUrl,
        open_mode: values.openMode,
        icon: link?.icon ?? null,
        sort_order: link?.sort_order ?? 0,
        is_active: link?.is_active ?? true,
        city_id: link?.city_id ?? null,
      };

      setValues((current) => ({ ...current, url: normalizedUrl, title: savedLink.title }));
      router.refresh();
      onSaved(savedLink, result.message);
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-bold text-slate-700">
          <span>网址</span>
          <input value={values.url} onChange={(event) => updateUrl(event.target.value)} placeholder="/jobs" className={inputClass} required />
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-700">
          <span>网站名称</span>
          <input
            value={values.title}
            onChange={(event) => {
              setTitleTouched(true);
              updateValue("title", event.target.value);
            }}
            className={inputClass}
            required
          />
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-700">
          <span>打开方式</span>
          <select value={values.openMode} onChange={(event) => updateValue("openMode", event.target.value === "new" ? "new" : "same")} className={inputClass}>
            <option value="new">新窗口</option>
            <option value="same">当前窗口</option>
          </select>
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

function titleFromUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed.split("/").filter(Boolean).at(-1) || "导航";
  }

  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    const hostname = url.hostname.replace(/^www\./, "");
    return hostname.split(".")[0] || "";
  } catch {
    return "";
  }
}
