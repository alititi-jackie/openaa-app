"use client";

import { AdminActionForm, AdminCheckbox } from "@/components/admin/AdminActionForm";
import { permanentlyDeleteAd, restoreDeletedAd } from "@/features/ads/adminActions";
import type { AdminAdRecycleBinItem } from "@/features/ads/adminQueries";

export function AdminAdRecycleBinList({ items }: { items: AdminAdRecycleBinItem[] }) {
  if (items.length === 0) {
    return <p className="rounded-xl bg-slate-50 px-3 py-3 text-sm font-bold text-slate-500">当前没有已删除广告。</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-700">已删除</span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">{item.positionLabel}</span>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600">{item.linkType === "internal" ? "内部详情" : "外部链接"}</span>
                {item.imageAssetId ? <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600">有图片</span> : null}
              </div>
              <h3 className="mt-2 line-clamp-2 font-black text-slate-950">{item.title}</h3>
              {item.href ? <p className="mt-1 break-all text-sm font-semibold text-slate-600">{item.href}</p> : null}
              <div className="mt-2 grid gap-1 text-xs font-semibold text-slate-500 md:grid-cols-3">
                <span>删除时间：{formatDateTime(item.deletedAt)}</span>
                <span>删除人：{item.deletedBy ?? "未记录"}</span>
                <span className="break-all">ID：{item.id}</span>
              </div>
              {item.imageUrl ? (
                <a href={item.imageUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-black text-blue-700">
                  打开广告图片
                </a>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <AdminActionForm action={restoreDeletedAd} submitLabel="恢复为停用" className="contents" submitClassName="inline-flex min-h-9 items-center rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-black text-white">
                <input type="hidden" name="id" value={item.id} />
              </AdminActionForm>
              <AdminActionForm action={permanentlyDeleteAd} submitLabel="永久删除" className="grid gap-2 rounded-xl bg-white p-2 ring-1 ring-red-100" submitClassName="inline-flex min-h-9 items-center justify-center rounded-xl bg-red-600 px-3 py-1.5 text-xs font-black text-white">
                <input type="hidden" name="id" value={item.id} />
                <AdminCheckbox name="confirm_permanent_delete" label="确认永久删除" />
              </AdminActionForm>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function formatDateTime(value: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "未记录" : date.toLocaleString("zh-CN", { hour12: false, timeZone: "America/New_York" });
}
