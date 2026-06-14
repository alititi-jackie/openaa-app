"use client";

import { useActionState, useState } from "react";
import { restoreDeletedPost, type AdminPostActionState } from "@/features/posts/adminActions";

const initialActionState: AdminPostActionState = { ok: true, message: "" };

const restoreNotificationDefault = {
  templateKey: "admin_post_restored",
  title: "信息已恢复",
  body: "你的已删除信息已由管理员恢复。当前状态为未上架，如需重新公开显示，请进入我的发布，点击恢复显示或重新上架。",
};

export function RecycleBinRestoreNotifyForm({ id, resourceType, title }: { id: string; resourceType: "post" | "news"; title: string }) {
  const [open, setOpen] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState(restoreNotificationDefault.title);
  const [notificationBody, setNotificationBody] = useState(restoreNotificationDefault.body);
  const [state, formAction, pending] = useActionState(restoreDeletedPost, initialActionState);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} disabled={pending} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? "恢复中..." : "恢复"}
      </button>
      {state.message ? <p className={state.ok ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-red-600"}>{state.message}</p> : null}
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
          <form action={formAction} className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="resource_type" value={resourceType} />
            <input type="hidden" name="content_type" value={resourceType} />
            <input type="hidden" name="notification_template_key" value={restoreNotificationDefault.templateKey} />
            <input type="hidden" name="notification_action_url" value="/profile/posts" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-950">通知用户</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">{title}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
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
              <button type="button" onClick={() => setOpen(false)} disabled={pending} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-60">
                取消
              </button>
              <button type="submit" disabled={pending} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-700 px-4 py-2 text-sm font-black text-white disabled:opacity-60">
                不通知用户，直接执行
              </button>
              <button type="submit" name="notify_user" value="on" disabled={pending} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white disabled:opacity-60">
                通知用户并执行
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
