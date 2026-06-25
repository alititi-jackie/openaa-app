"use client";

import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";
import { AdminDeletionSettingsCard } from "@/components/admin/AdminDeletionSettingsCard";
import { RecycleBinHealthCard } from "@/components/admin/RecycleBinHealthCard";
import {
  permanentlyDeletePost,
  restoreDeletedPost,
  updateRecycleBinNewsRetentionSettings,
  updateRecycleBinRetentionSettings,
  type AdminPostActionState,
} from "@/features/posts/adminActions";
import type { PostType } from "@/features/posts/types";
import type {
  RecycleBinFilter,
  RecycleBinHealth,
  RecycleBinItem,
  RecycleBinNewsFilter,
  RecycleBinNewsHealth,
  RecycleBinNewsRetentionSettings,
  RecycleBinRetentionSettings,
} from "@/features/posts/adminQueries";

const DATE_TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  hour12: false,
  timeZone: "America/New_York",
};

const initialActionState: AdminPostActionState = { ok: true, message: "" };
const restoreNotificationDefault = {
  templateKey: "admin_post_restored",
  title: "信息已恢复",
  body: "你的已删除信息已由管理员恢复。当前状态为未上架，如需重新公开显示，请进入我的发布，点击恢复显示或重新上架。",
};

export function RecycleBinSettingsSection({ settings }: { settings: RecycleBinRetentionSettings }) {
  const [state, action, pending] = useActionState(updateRecycleBinRetentionSettings, initialActionState);

  return (
    <AdminDeletionSettingsCard>
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
    </AdminDeletionSettingsCard>
  );
}

export function RecycleBinNewsSettingsSection({ settings }: { settings: RecycleBinNewsRetentionSettings }) {
  const [state, action, pending] = useActionState(updateRecycleBinNewsRetentionSettings, initialActionState);

  return (
    <AdminDeletionSettingsCard>
      <form action={action} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <RetentionInput label="新闻删除保留" name="news_retention_days" defaultValue={settings.newsRetentionDays} />
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
    </AdminDeletionSettingsCard>
  );
}

export function RecycleBinHealthSection({ health, activeFilter, postType = "all" }: { health: RecycleBinHealth; activeFilter: RecycleBinFilter; postType?: PostType | "all" }) {
  return (
    <CollapsibleSection title="健康检查">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <RecycleBinHealthCard label="已超期" value={health.overdueCount} href={postRecycleBinHref("expired", postType)} active={activeFilter === "expired"} />
        <RecycleBinHealthCard label="带图片" value={health.deletedPostsWithImagesCount} href={postRecycleBinHref("with_images", postType)} active={activeFilter === "with_images"} />
        <RecycleBinHealthCard label="图片异常" value={health.possibleMissingStorageCount} href={postRecycleBinHref("image_error", postType)} active={activeFilter === "image_error"} />
        <RecycleBinHealthCard label="收藏孤儿" value={health.orphanFavoriteCount} href={postRecycleBinHref("orphan_favorites", postType)} active={activeFilter === "orphan_favorites"} />
      </div>
    </CollapsibleSection>
  );
}

export function RecycleBinNewsHealthSection({ health, activeFilter, category = "all" }: { health: RecycleBinNewsHealth; activeFilter: RecycleBinNewsFilter; category?: string }) {
  return (
    <CollapsibleSection title="健康检查">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <RecycleBinHealthCard label="已超期" value={health.overdueCount} href={newsRecycleBinHref("expired", category)} active={activeFilter === "expired"} />
        <RecycleBinHealthCard label="带图片" value={health.newsWithImagesCount} href={newsRecycleBinHref("with_images", category)} active={activeFilter === "with_images"} />
        <RecycleBinHealthCard label="图片异常" value={health.imageErrorCount} href={newsRecycleBinHref("image_error", category)} active={activeFilter === "image_error"} />
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

function postRecycleBinHref(filter: RecycleBinFilter, postType: PostType | "all") {
  const params = new URLSearchParams({ tab: "post" });
  if (postType !== "all") params.set("type", postType);
  if (filter !== "all") params.set("filter", filter);
  return `/admin/recycle-bin?${params.toString()}`;
}

function newsRecycleBinHref(filter: RecycleBinNewsFilter, category: string) {
  const params = new URLSearchParams({ tab: "news" });
  if (category && category !== "all") params.set("category", category);
  if (filter !== "all") params.set("filter", filter);
  return `/admin/recycle-bin?${params.toString()}`;
}

function RecycleBinRow({ item }: { item: RecycleBinItem }) {
  const [restoreState, restoreAction, restorePending] = useActionState(restoreDeletedPost, initialActionState);
  const [deleteState, deleteAction, deletePending] = useActionState(permanentlyDeletePost, initialActionState);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState(restoreNotificationDefault.title);
  const [notificationBody, setNotificationBody] = useState(restoreNotificationDefault.body);
  const restored = restoreState.ok && restoreState.message.startsWith("已恢复");

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
              {item.contentType === "post" ? (
                <button type="button" onClick={() => setRestoreDialogOpen(true)} disabled={restorePending} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
                  {restorePending ? "恢复中..." : "恢复"}
                </button>
              ) : (
                <form action={restoreAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="resource_type" value={item.contentType} />
                  <input type="hidden" name="content_type" value={item.contentType} />
                  <button type="submit" disabled={restorePending} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
                    {restorePending ? "恢复中..." : "恢复"}
                  </button>
                </form>
              )}
              {item.contentType === "post" && restoreDialogOpen ? (
                <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
                  <form action={restoreAction} className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="resource_type" value={item.contentType} />
                    <input type="hidden" name="content_type" value={item.contentType} />
                    <input type="hidden" name="notification_template_key" value={restoreNotificationDefault.templateKey} />
                    <input type="hidden" name="notification_action_url" value="/profile/posts" />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-slate-950">通知用户</h3>
                        <p className="mt-1 text-sm font-semibold text-slate-500">{item.title}</p>
                      </div>
                      <button type="button" onClick={() => setRestoreDialogOpen(false)} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
                        取消
                      </button>
                    </div>
                    <label className="mt-4 grid gap-1.5 text-sm font-bold text-slate-700">
                      <span>模板</span>
                      <select value={restoreNotificationDefault.templateKey} disabled className="min-h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                        <option value={restoreNotificationDefault.templateKey}>{restoreNotificationDefault.templateKey}</option>
                      </select>
                    </label>
                    <label className="mt-3 grid gap-1.5 text-sm font-bold text-slate-700">
                      <span>通知标题</span>
                      <input name="notification_title" value={notificationTitle} onChange={(event) => setNotificationTitle(event.target.value)} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500" />
                    </label>
                    <label className="mt-3 grid gap-1.5 text-sm font-bold text-slate-700">
                      <span>通知正文</span>
                      <textarea name="notification_body" rows={5} value={notificationBody} onChange={(event) => setNotificationBody(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-900 outline-none focus:border-blue-500" />
                    </label>
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      <button type="button" onClick={() => setRestoreDialogOpen(false)} disabled={restorePending} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-60">
                        取消
                      </button>
                      <button type="submit" disabled={restorePending} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-700 px-4 py-2 text-sm font-black text-white disabled:opacity-60">
                        不通知用户，直接执行
                      </button>
                      <button type="submit" name="notify_user" value="on" disabled={restorePending} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white disabled:opacity-60">
                        通知用户并执行
                      </button>
                    </div>
                  </form>
                </div>
              ) : null}
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
  return Number.isNaN(date.getTime()) ? "未记录" : date.toLocaleString("zh-CN", DATE_TIME_FORMAT_OPTIONS);
}
