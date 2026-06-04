"use client";

import { useActionState } from "react";
import { manageOwnPostStatus, type ManagePostActionState } from "@/features/posts/actions";
import type { PostStatus } from "@/features/posts/types";

const initialState: ManagePostActionState = { ok: true, message: "" };

export function UserJobManagementActions({ postId, status }: { postId: string; status?: PostStatus }) {
  const [state, formAction, pending] = useActionState(manageOwnPostStatus, initialState);
  const canHide = status === "published";
  const canRestore = status === "hidden" || status === "draft" || status === "expired";
  const canDelete = status !== "deleted";

  if (!canHide && !canRestore && !canDelete) return null;

  return (
    <form
      action={formAction}
      className="mt-4 space-y-2"
      onSubmit={(event) => {
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (submitter?.value === "hide" && !window.confirm("确认隐藏此招聘信息？")) event.preventDefault();
        if (submitter?.value === "delete" && !window.confirm("确认删除此职位？")) event.preventDefault();
      }}
    >
      <input type="hidden" name="postId" value={postId} />
      <div className="flex flex-wrap items-center gap-2">
        {canHide ? (
          <button type="submit" name="action" value="hide" disabled={pending} className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-100 disabled:opacity-60">
            隐藏
          </button>
        ) : null}
        {canRestore ? (
          <button type="submit" name="action" value="publish" disabled={pending} className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100 disabled:opacity-60">
            恢复显示
          </button>
        ) : null}
        {canDelete ? (
          <button type="submit" name="action" value="delete" disabled={pending} className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-200 transition hover:bg-red-100 disabled:opacity-60">
            删除
          </button>
        ) : null}
      </div>
      {state.message ? <p className={state.ok ? "text-xs font-bold text-emerald-700" : "text-xs font-bold text-red-600"}>{state.message}</p> : null}
    </form>
  );
}
