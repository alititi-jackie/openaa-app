"use client";

import { useActionState, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteUserNavigationLink, moveUserNavigationLink, type NavigationActionState } from "@/features/navigation/actions";
import type { UserNavigationLink } from "@/features/navigation/types";
import { cn } from "@/lib/utils/cn";
import { MyNavigationForm } from "./MyNavigationForm";

const initialState: NavigationActionState = { ok: true, message: "" };

export function MyNavigationList({ links }: { links: UserNavigationLink[] }) {
  const [adding, setAdding] = useState(false);
  const [managing, setManaging] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-950">我的导航</h2>
          <p className="text-sm font-semibold text-slate-500">我的常用</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setManaging((value) => !value);
              setEditingId(null);
            }}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm"
          >
            {managing ? "完成" : "管理"}
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding((value) => !value);
              setEditingId(null);
            }}
            className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 shadow-sm"
          >
            <Plus size={16} aria-hidden="true" />
            添加网址
          </button>
        </div>
      </div>

      {adding ? <MyNavigationForm onSaved={() => setAdding(false)} onCancel={() => setAdding(false)} /> : null}

      {links.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center shadow-sm">
          <p className="text-base font-black text-slate-950">还没有我的导航</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">添加常用网站后，会显示在这里。</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {links.map((link, index) => (
            <div key={link.id} className="space-y-2">
              <MyNavigationCard link={link} managing={managing} />
              {managing ? (
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  <MoveForm id={link.id} direction="up" disabled={index === 0} />
                  <MoveForm id={link.id} direction="down" disabled={index === links.length - 1} />
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId((value) => (value === link.id ? null : link.id));
                      setAdding(false);
                    }}
                    className="inline-flex min-h-9 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-black text-slate-700"
                  >
                    <Pencil size={13} aria-hidden="true" />
                    编辑
                  </button>
                  <DeleteForm id={link.id} />
                </div>
              ) : null}
              {editingId === link.id ? <MyNavigationForm link={link} onSaved={() => setEditingId(null)} onCancel={() => setEditingId(null)} /> : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function MyNavigationCard({ link, managing }: { link: UserNavigationLink; managing: boolean }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative flex min-h-[94px] flex-col justify-between rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md",
        managing && "pointer-events-none",
      )}
    >
      <ExternalLink className="absolute right-3 top-3 text-slate-300 transition group-hover:text-blue-500" size={15} aria-hidden="true" />
      <span className="block pr-6 text-base font-black leading-tight text-slate-950">{link.title}</span>
      <span className="mt-3 block truncate text-xs font-semibold text-slate-500">{displayHost(link.url)}</span>
    </a>
  );
}

function MoveForm({ id, direction, disabled }: { id: string; direction: "up" | "down"; disabled: boolean }) {
  const [, formAction, pending] = useActionState(moveUserNavigationLink, initialState);
  const Icon = direction === "up" ? ArrowUp : ArrowDown;

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        disabled={disabled || pending}
        className="inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Icon size={13} aria-hidden="true" />
        {direction === "up" ? "上移" : "下移"}
      </button>
    </form>
  );
}

function DeleteForm({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(deleteUserNavigationLink, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("确认删除这个网址吗？")) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        title={state.message || undefined}
        className="inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-xl border border-red-100 bg-red-50 px-2 py-1.5 text-xs font-black text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 size={13} aria-hidden="true" />
        删除
      </button>
    </form>
  );
}

function displayHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
