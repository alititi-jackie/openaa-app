"use client";

import Link from "next/link";
import { useActionState } from "react";
import { permanentlyDeleteNavigationLink, restoreNavigationLink, type NavigationActionState } from "@/features/navigation/actions";
import type { NavigationLink } from "@/features/navigation/types";

const initialState: NavigationActionState = { ok: true, message: "" };

export function NavigationRecycleBinList({ links, kind }: { links: NavigationLink[]; kind: "links" | "categories" }) {
  if (kind === "categories") {
    return <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">分类回收站入口已预留；当前版本公共导航分类尚未接入软删除。</p>;
  }

  if (links.length === 0) {
    return <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">暂无已删除网站。</p>;
  }

  return (
    <div className="space-y-3">
      {links.map((link) => (
        <NavigationRecycleBinRow key={link.id} link={link} />
      ))}
    </div>
  );
}

function NavigationRecycleBinRow({ link }: { link: NavigationLink }) {
  const [restoreState, restoreAction, restorePending] = useActionState(restoreNavigationLink, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(permanentlyDeleteNavigationLink, initialState);
  const restored = restoreState.ok && restoreState.message === "导航链接已恢复。";

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">{link.categoryName}</span>
            {restored ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">已恢复</span> : null}
          </div>
          <h2 className="mt-2 line-clamp-2 font-black text-slate-950">{link.title}</h2>
          <p className="mt-1 break-all text-sm font-semibold text-slate-600">{link.url}</p>
          <div className="mt-2 grid gap-1 text-xs font-semibold text-slate-500 md:grid-cols-3">
            <span>所属分类：{link.categoryName}</span>
            <span>删除时间：{formatDateTime(link.deletedAt)}</span>
            <span className="break-all">删除人：{link.deletedBy ?? "未记录"}</span>
          </div>
          {restoreState.message ? <p className={restoreState.ok ? "mt-2 text-sm font-semibold text-emerald-700" : "mt-2 text-sm font-semibold text-red-600"}>{restoreState.message}</p> : null}
          {deleteState.message ? <p className={deleteState.ok ? "mt-2 text-sm font-semibold text-emerald-700" : "mt-2 text-sm font-semibold text-red-600"}>{deleteState.message}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/recycle-bin/navigation/${link.id}`} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-white px-3 py-2 text-sm font-black text-blue-700 ring-1 ring-slate-200">
            查看
          </Link>
          {restored ? null : (
            <>
              <form action={restoreAction}>
                <input type="hidden" name="id" value={link.id} />
                <button type="submit" disabled={restorePending} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-sm font-black text-white disabled:opacity-60">
                  {restorePending ? "恢复中..." : "恢复"}
                </button>
              </form>
              <form action={deleteAction}>
                <input type="hidden" name="id" value={link.id} />
                <button type="submit" disabled={deletePending} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-red-600 px-3 py-2 text-sm font-black text-white disabled:opacity-60">
                  {deletePending ? "删除中..." : "永久删除"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function formatDateTime(value: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "未记录" : date.toLocaleString("zh-CN", { hour12: false });
}
