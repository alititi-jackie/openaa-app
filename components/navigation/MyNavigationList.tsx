"use client";

import { useActionState, useState } from "react";
import { ExternalLink, Plus } from "lucide-react";
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
            className={cn(
              "inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-black shadow-sm",
              managing ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-700",
            )}
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
              <MyNavigationCard
                link={link}
                managing={managing}
                isFirst={index === 0}
                isLast={index === links.length - 1}
                onEdit={() => {
                  setEditingId((value) => (value === link.id ? null : link.id));
                  setAdding(false);
                }}
              />
              {editingId === link.id ? <MyNavigationForm link={link} onSaved={() => setEditingId(null)} onCancel={() => setEditingId(null)} /> : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function MyNavigationCard({
  link,
  managing,
  isFirst,
  isLast,
  onEdit,
}: {
  link: UserNavigationLink;
  managing: boolean;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
}) {
  const content = (
    <div className="relative min-h-[82px] rounded-xl bg-slate-50/70 p-3">
      <ExternalLink className="absolute right-3 top-3 text-slate-300 transition group-hover:text-blue-500" size={15} aria-hidden="true" />
      <span className="block pr-6 text-base font-black leading-tight text-slate-950">{link.title}</span>
      <span className="mt-3 block truncate text-xs font-semibold text-slate-400">{displayHost(link.url)}</span>
    </div>
  );

  if (!managing) {
    return (
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block rounded-2xl border border-slate-100 bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="group pointer-events-none block">
        {content}
      </a>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <MoveForm id={link.id} direction="up" disabled={isFirst} />
        <MoveForm id={link.id} direction="down" disabled={isLast} />
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-black text-slate-700"
        >
          ✎ 编辑
        </button>
        <DeleteForm id={link.id} />
      </div>
    </div>
  );
}

function MoveForm({ id, direction, disabled }: { id: string; direction: "up" | "down"; disabled: boolean }) {
  const [, formAction, pending] = useActionState(moveUserNavigationLink, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        disabled={disabled || pending}
        className="inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {direction === "up" ? "↑ 上移" : "↓ 下移"}
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
        🗑 删除
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
