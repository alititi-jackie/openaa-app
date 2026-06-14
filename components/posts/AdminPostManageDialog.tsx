"use client";

import { useActionState, useMemo, useState } from "react";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { handleAdminPostOperation, type AdminPostActionState } from "@/features/posts/adminActions";
import { getAdminPostOperationOptions, type AdminPostOperation } from "@/features/posts/adminOperations";
import type { AdminPostNotificationTemplate } from "@/features/posts/adminQueries";
import type { PostStatus } from "@/features/posts/types";

type ManagePostRef = {
  id: string;
  title: string;
  status: PostStatus;
};

const initialActionState: AdminPostActionState = { ok: true, message: "" };

export function AdminPostManageDialog({
  post,
  templates,
  buttonLabel = "管理",
}: {
  post: ManagePostRef;
  templates: AdminPostNotificationTemplate[];
  buttonLabel?: string;
}) {
  const options = useMemo(() => getAdminPostOperationOptions(post.status), [post.status]);
  const firstOption = options[0];
  const [open, setOpen] = useState(false);
  const [operation, setOperation] = useState<AdminPostOperation | "">(firstOption?.operation ?? "");
  const selectedOption = useMemo(() => options.find((option) => option.operation === operation) ?? firstOption, [firstOption, operation, options]);
  const [templateKey, setTemplateKey] = useState(selectedOption?.defaultTemplateKey ?? "");
  const selectedTemplate = useMemo(() => findTemplate(templates, templateKey), [templateKey, templates]);
  const [title, setTitle] = useState(selectedTemplate?.title ?? "");
  const [body, setBody] = useState(selectedTemplate?.body ?? "");
  const [state, formAction, pending] = useActionState(handleAdminPostOperation, initialActionState);

  function applyTemplate(nextKey: string) {
    const nextTemplate = findTemplate(templates, nextKey);
    setTemplateKey(nextKey);
    setTitle(nextTemplate?.title ?? "");
    setBody(nextTemplate?.body ?? "");
  }

  function handleOperationChange(nextOperation: string) {
    const nextOption = options.find((option) => option.operation === nextOperation);
    if (!nextOption) return;
    setOperation(nextOption.operation);
    applyTemplate(nextOption.defaultTemplateKey);
  }

  function handleTemplateChange(nextKey: string) {
    applyTemplate(nextKey);
  }

  return (
    <>
      <AdminActionButton onClick={() => setOpen(true)} variant="primary" disabled={options.length === 0}>
        {buttonLabel}
      </AdminActionButton>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
          <form action={formAction} className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-xl">
            <input type="hidden" name="id" value={post.id} />
            <input type="hidden" name="operation" value={operation} />
            <input type="hidden" name="notification_template_key" value={templateKey} />
            <input type="hidden" name="notification_action_url" value="/profile/posts" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-950">管理用户发布信息</h3>
                <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-500">{post.title}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
                取消
              </button>
            </div>

            <label className="mt-4 grid gap-1.5 text-sm font-bold text-slate-700">
              <span>处理类型</span>
              <select
                value={operation}
                onChange={(event) => handleOperationChange(event.target.value)}
                className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
              >
                {options.map((option) => (
                  <option key={option.operation} value={option.operation}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-3 grid gap-1.5 text-sm font-bold text-slate-700">
              <span>通知模板</span>
              <select
                value={templateKey}
                onChange={(event) => handleTemplateChange(event.target.value)}
                className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
              >
                {templates.length > 0 ? (
                  templates.map((template) => (
                    <option key={template.key} value={template.key}>
                      {template.title} · {template.key}
                    </option>
                  ))
                ) : (
                  <option value={templateKey}>模板暂时不可用</option>
                )}
              </select>
            </label>

            <label className="mt-3 grid gap-1.5 text-sm font-bold text-slate-700">
              <span>通知标题</span>
              <input name="notification_title" value={title} onChange={(event) => setTitle(event.target.value)} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500" />
            </label>

            <label className="mt-3 grid gap-1.5 text-sm font-bold text-slate-700">
              <span>通知正文</span>
              <textarea name="notification_body" rows={5} value={body} onChange={(event) => setBody(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-900 outline-none focus:border-blue-500" />
            </label>

            {state.message ? <p className={state.ok ? "mt-3 text-sm font-semibold text-emerald-700" : "mt-3 text-sm font-semibold text-red-600"}>{state.message}</p> : null}

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} disabled={pending} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-60">
                取消
              </button>
              <button type="submit" disabled={pending || !operation} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-700 px-4 py-2 text-sm font-black text-white disabled:opacity-60">
                不通知用户，直接执行
              </button>
              <button type="submit" name="notify_user" value="on" disabled={pending || !operation} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white disabled:opacity-60">
                通知用户并执行
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

function findTemplate(templates: AdminPostNotificationTemplate[], key: string) {
  return templates.find((template) => template.key === key) ?? null;
}
