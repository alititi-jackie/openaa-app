"use client";

import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";
import { permanentlyDeletePost, restoreDeletedPost, updateRecycleBinRetentionSettings, type AdminPostActionState } from "@/features/posts/adminActions";
import type { RecycleBinFilter, RecycleBinHealth, RecycleBinItem, RecycleBinRetentionSettings } from "@/features/posts/adminQueries";

const initialActionState: AdminPostActionState = { ok: true, message: "" };

export function RecycleBinSettingsSection({ settings }: { settings: RecycleBinRetentionSettings }) {
  const [state, action, pending] = useActionState(updateRecycleBinRetentionSettings, initialActionState);

  return (
    <CollapsibleSection title="删除设置">
      <form action={action} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <RetentionInput label="用户删除保留" name="user_retention_days" defaultValue={settings.userRetentionDays} />
          <RetentionInput label="管理员删除保留" name="admin_retention_days" defaultValue={settings.adminRetentionDays} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "保存中..." : "保存设置"}
          </button>
          {state.message ? <p className={state.ok ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-red-600"}>{state.message}</p> : null}
        </div>
      </form>
    </CollapsibleSection>
  );
}

export function RecycleBinHealthSection({ health, activeFilter }: { health: RecycleBinHealth; activeFilter: RecycleBinFilter }) {
  return (
    <CollapsibleSection title="健康检查">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <HealthLink label="已超期" value={health.overdueCount} href="/admin/recycle-bin?tab=post&filter=expired" active={activeFilter === "expired"} />
        <HealthLink label="带图片" value={health.deletedPostsWithImagesCount} href="/admin/recycle-bin?tab=post&filter=with_images" active={activeFilter === "with_images"} />
        <HealthLink label="图片异常" value={health.possibleMissingStorageCount} href="/admin/recycle-bin?tab=post&filter=image_error" active={activeFilter === "image_error"} />
        <HealthLink label="收藏孤儿" value={health.orphanFavoriteCount} href="/admin/recycle-bin?tab=post&filter=orphan_favorites" active={activeFilter === "orphan_favorites"} />
      </div>
    </CollapsibleSection>
  );
}

export function OrphanFavoritesNotice({ visible, count }: { visible: boolean; count: number }) {
  if (!visible) return null;

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold leading-6 text-blue-800">
      收藏孤儿检查当前发现 {count} 条可能引用已不存在帖子的收藏记录。第一版先展示检查结果说明，暂不做列表和批量清理。
    </div>
  );
}

export function RecycleBinList({ items }: { items: RecycleBinItem[] }) {
  if (items.length === 0) {
    return <div className="rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-500">当前分类没有回收站内容。</div>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <RecycleBinRow key={item.id} item={item} />
      ))}
    </div>
  );
}

function CollapsibleSection({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
        <button type="button" onClick={() => setOpen((current) => !current)} className="text-sm font-black text-blue-700 hover:text-blue-800">
          {open ? "收起 ▴" : "展开 ▾"}
        </button>
      </div>
      {open ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}

function RetentionInput({ label, name, defaultValue }: { label: string; name: string; defaultValue: number }) {
  return (
    <label className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
      <span className="block text-xs font-bold text-slate-500">{label}</span>
      <span className="mt-2 flex items-center gap-2">
        <input
          name={name}
          type="number"
          min={1}
          max={3650}
          step={1}
          required
          defaultValue={defaultValue}
          className="min-h-10 w-32 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-950 outline-none focus:border-blue-500"
        />
        <span className="text-sm font-black text-slate-700">天</span>
      </span>
    </label>
  );
}

function HealthLink({ label, value, href, active }: { label: string; value: number; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`block rounded-xl p-3 ring-1 transition ${
        active ? "bg-blue-50 text-blue-900 ring-blue-200" : "bg-slate-50 text-slate-950 ring-slate-100 hover:bg-slate-100"
      }`}
    >
      <span className="block text-xs font-bold text-slate-500">{label}</span>
      <span className="mt-1 block text-2xl font-black">{value}</span>
    </Link>
  );
}

function RecycleBinRow({ item }: { item: RecycleBinItem }) {
  const [restoreState, restoreAction, restorePending] = useActionState(restoreDeletedPost, initialActionState);
  const [deleteState, deleteAction, deletePending] = useActionState(permanentlyDeletePost, initialActionState);
  const restored = restoreState.ok && restoreState.message === "已恢复";

  return (
    <article className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">{item.typeLabel}</span>
            <span className={restored ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700" : "rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-700"}>
              {restored ? "已恢复" : item.status}
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600">{sourceLabel(item.deletedSource)}</span>
            {item.hasImageError ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">图片异常</span> : null}
          </div>
          <h2 className="mt-2 line-clamp-2 font-black text-slate-950">{item.title}</h2>
          <div className="mt-2 grid gap-1 text-xs font-semibold text-slate-500 md:grid-cols-4">
            <span>删除时间：{formatDateTime(item.deletedAt)}</span>
            <span>图片数量：{item.imageCount}</span>
            <span>自动物理删除时间：{formatDateTime(item.purgeAt)}</span>
            <span className="break-all">ID：{item.id}</span>
          </div>
          {item.imageError ? <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">图片异常：{item.imageError}</p> : null}
          {restoreState.message && !restoreState.ok ? <p className="mt-2 text-sm font-semibold text-red-600">{restoreState.message}</p> : null}
          {deleteState.message ? <p className={deleteState.ok ? "mt-2 text-sm font-semibold text-emerald-700" : "mt-2 text-sm font-semibold text-red-600"}>{deleteState.message}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={item.href} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-white px-3 py-2 text-sm font-black text-blue-700 ring-1 ring-slate-200">
            查看
          </Link>
          {restored ? null : (
            <>
              <form action={restoreAction}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="resource_type" value={item.contentType} />
                <input type="hidden" name="content_type" value={item.contentType} />
                <button type="submit" disabled={restorePending} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
                  {restorePending ? "恢复中..." : "恢复"}
                </button>
              </form>
              <form action={deleteAction} className="grid gap-2 rounded-xl bg-white p-2 ring-1 ring-red-100">
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="resource_type" value={item.contentType} />
                <input type="hidden" name="content_type" value={item.contentType} />
                <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                  <input name="confirm_permanent_delete" type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                  <span>永久删除后不可恢复。</span>
                </label>
                <button type="submit" disabled={deletePending} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-red-600 px-3 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
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

function sourceLabel(source: RecycleBinItem["deletedSource"]) {
  if (source === "user") return "用户删除";
  if (source === "admin") return "管理员删除";
  return "未知来源";
}

function formatDateTime(value: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "未记录" : date.toLocaleString("zh-CN", { hour12: false });
}
